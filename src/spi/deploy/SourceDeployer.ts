import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../common/slack/addressChannels";
import { ManagedDeploymentTargetInfo } from "../../handlers/events/delivery/deploy/local/appManagement";
import { LogInterpreter } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";

/**
 * Implemented by classes that can deploy from source
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(ti: ManagedDeploymentTargetInfo): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     ti: ManagedDeploymentTargetInfo,
                     log: ProgressLog,
                     creds: ProjectOperationCredentials,
                     atomistTeam: string): Promise<Deployment>;

    logInterpreter?: LogInterpreter;
}
