import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../common/slack/addressChannels";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";
import { ManagedDeploymentTargetInfo } from "../../handlers/events/delivery/deploy/local/appManagement";

/**
 * Implemented by classes that can deploy from source
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(id: RemoteRepoRef, branch: string): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     ti: ManagedDeploymentTargetInfo,
                     log: ProgressLog,
                     creds: ProjectOperationCredentials,
                     atomistTeam: string): Promise<Deployment>;
}
