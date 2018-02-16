import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Readable } from "stream";
import { AppInfo } from "./Deployment";
import { LinkablePersistentProgressLog } from "./log/ProgressLog";
import EventEmitter = NodeJS.EventEmitter;

export interface RunningBuild {

    readonly stream: EventEmitter;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitStream: Readable;

    readonly deploymentUnitFile: string;

    readonly url: string;
}

export interface Builder {

    build(creds: ProjectOperationCredentials, id: RemoteRepoRef,
          team: string, log: LinkablePersistentProgressLog): Promise<RunningBuild>;

}
