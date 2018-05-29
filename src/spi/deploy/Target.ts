import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Goal } from "../../api/goal/Goal";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T;

export interface DeployStage {
    deployGoal: Goal;
    endpointGoal: Goal;
    undeployGoal: Goal;
}

export interface DeployerInfo<T extends TargetInfo> {
    deployer: Deployer<T>;
    targeter: Targeter<T>;
}

export interface Target<T extends TargetInfo = TargetInfo> extends DeployerInfo<T>, DeployStage {
}
