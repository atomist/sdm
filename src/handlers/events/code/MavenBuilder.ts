import { spawn } from "child_process";
import { Builder, LocalBuilder, RunningBuild } from "./Builder";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import EventEmitter = NodeJS.EventEmitter;

export class MavenBuilder extends LocalBuilder {

    protected startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string): Promise<RunningBuild> {
        return GitCommandGitProject.cloned(creds, rr)
            .then(p => {
                console.log(`--------------- cloned to ${p.baseDir}`);
                const childProcess = spawn("mvn", [
                    "package",
                    "-DskipTests",
                ], {
                    cwd: p.baseDir,
                });
                const rb = new YuckyBuild();
                rb.stream = childProcess;
                rb.rr = rr;
                childProcess.stdout.on("data", data => {
                    //console.log("Saw data " + data.to())
                    rb.l += data.toString()
                });
                return rb;
            });
    }

}

class YuckyBuild implements RunningBuild {

    public stream: EventEmitter;

    public rr: RemoteRepoRef;

    public l: string = "";

    get log() {
        return this.l;
    }
}