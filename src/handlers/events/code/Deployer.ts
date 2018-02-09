import { Deployment, TargetInfo } from "./Deployment";
import { DeployableArtifact } from "./DeployOnBuildSuccessStatus";
import { ProgressLog } from "./ProgressLog";

export interface Deployer<T extends TargetInfo> {

    deploy(ai: DeployableArtifact, cfi: T, log: ProgressLog): Promise<Deployment>;

}
