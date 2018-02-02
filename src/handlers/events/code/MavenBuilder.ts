import { ChildProcess, spawn } from "child_process";
import { Builder, LocalBuilder, RunningBuild } from "./Builder";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import EventEmitter = NodeJS.EventEmitter;

export class MavenBuilder extends LocalBuilder {

    protected startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string): Promise<RunningBuild> {
        return GitCommandGitProject.cloned(creds, rr)
            .then(p => {
                const childProcess = spawn("mvn", [
                    "package",
                    "-DskipTests",
                ], {
                    cwd: p.baseDir,
                });
                const rb = new UpdatingBuild(rr, childProcess, team);
                childProcess.stdout.on("data", data => {
                    //console.log("Saw data " + data.to())
                    rb.l += data.toString();
                });
                return rb;
            });
    }

}

class UpdatingBuild implements RunningBuild {

    constructor(public repoRef: RemoteRepoRef, public stream: ChildProcess, public team: string) {}

    public l: string = "";

    get log() {
        return this.l;
    }
}
