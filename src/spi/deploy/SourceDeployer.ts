import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ManagedDeploymentTargetInfo } from "../../handlers/events/delivery/deploy/local/appManagement";
import { LogInterpreter } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";

/**
 * Implemented by classes that can deploy from source.
 * Such deployers do not need an artifact to have been built by
 * execution of a previous Build goal.
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(ti: ManagedDeploymentTargetInfo): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     ti: ManagedDeploymentTargetInfo,
                     log: ProgressLog,
                     credentials: ProjectOperationCredentials,
                     atomistTeam: string): Promise<Deployment>;

    logInterpreter?: LogInterpreter;
}
