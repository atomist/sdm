import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ChildProcess, spawn } from "child_process";
import { Readable } from "stream";
import {RunningBuild } from "../../../Builder";
import { AppInfo } from "../../../Deployment";
import { LocalBuilder } from "../LocalBuilder";
import { identification } from "./pomParser";

export class MavenBuilder extends LocalBuilder {

    protected startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string): Promise<RunningBuild> {
        return GitCommandGitProject.cloned(creds, rr)
            .then(p => {
                // Find the artifact info from Maven
                return p.findFile("pom.xml")
                    .then(pom => pom.getContent()
                        .then(content => identification(content)))
                    .then(va => ({...va, name: va.artifact}))
                    .then(appId => {
                        const childProcess = spawn("mvn", [
                            "package",
                            "-DskipTests",
                        ], {
                            cwd: p.baseDir,
                        });
                        const rb = new UpdatingBuild(rr, childProcess, team);
                        childProcess.stdout.on("data", data => {
                            rb.l += data.toString();
                        });
                        childProcess.addListener("exit", (code, signal) => {
                            console.log("Success at " + p.baseDir);
                            rb.ai = appId;
                            //rb._deploymentUnitStream = fs.createReadStream(`${p.baseDir}/target/losgatos1-0.1.0-SNAPSHOT.jar`);
                            rb._deploymentUnitFile = `${p.baseDir}/target/${appId.name}-${appId.version}.jar`;
                        });
                        return rb;
                    });
            });
    }

}

class UpdatingBuild implements RunningBuild {

    constructor(public repoRef: RemoteRepoRef, public stream: ChildProcess, public team: string) {
    }

    public l: string = "";

    public ai: AppInfo;

    public _deploymentUnitStream: Readable;

    public _deploymentUnitFile: string;

    get log() {
        return this.l;
    }

    get appInfo(): AppInfo {
        return this.ai;
    }

    get deploymentUnitStream(): Readable {
        return this._deploymentUnitStream;
    }

    get deploymentUnitFile(): string {
        return this._deploymentUnitFile;
    }

}
