
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";
import { AddressChannels } from "../../common/slack/addressChannels";

/**
 * Implemented by classes that can deploy from source
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(id: RemoteRepoRef, branch: string): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     addressChannels: AddressChannels,
                     log: ProgressLog,
                     creds: ProjectOperationCredentials,
                     atomistTeam: string,
                     branch: string): Promise<Deployment>;
}
