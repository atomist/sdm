import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ChildProcess, spawn } from "child_process";
import { Readable } from "stream";
import { ArtifactStore } from "../../../ArtifactStore";
import { AppInfo } from "../../../Deployment";
import { LinkableLogFactory, LinkablePersistentProgressLog } from "../../../log/ProgressLog";
import { LocalBuilder, LocalBuildInProgress } from "../LocalBuilder";
import { identification } from "./pomParser";

/**
 * Build with Maven in the local automation client.
 * This implementation requires Java and maven on the classpath.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class MavenBuilder extends LocalBuilder {

    constructor(artifactStore: ArtifactStore, logFactory: LinkableLogFactory) {
        super(artifactStore, logFactory);
    }

    protected startBuild(creds: ProjectOperationCredentials, id: RemoteRepoRef,
                         team: string, log: LinkablePersistentProgressLog): Promise<LocalBuildInProgress> {
        return GitCommandGitProject.cloned(creds, id)
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
                        const rb = new UpdatingBuild(id, childProcess, team, log.url);
                        childProcess.stdout.on("data", data => {
                            log.write(data.toString());
                        });
                        childProcess.addListener("exit", (code, signal) => {
                            rb.ai = appId;
                            // rb._deploymentUnitStream = fs.createReadStream(`${p.baseDir}/target/losgatos1-0.1.0-SNAPSHOT.jar`);
                            rb.deploymentUnitFile = `${p.baseDir}/target/${appId.name}-${appId.version}.jar`;
                        });
                        return rb;
                    });
            });
    }

}

class UpdatingBuild implements LocalBuildInProgress {

    constructor(public repoRef: RemoteRepoRef,
                public stream: ChildProcess,
                public team: string,
                public url: string) {
    }

    public ai: AppInfo;

    public deploymentUnitStream: Readable;

    public deploymentUnitFile: string;

    get appInfo(): AppInfo {
        return this.ai;
    }

}
