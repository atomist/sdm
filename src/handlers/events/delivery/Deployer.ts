import { Deployment, TargetInfo } from "./Deployment";
import { ProgressLog } from "./ProgressLog";
import { DeployableArtifact } from "./ArtifactStore";

export interface Deployer<T extends TargetInfo> {

    deploy(ai: DeployableArtifact, cfi: T, log: ProgressLog): Promise<Deployment>;

}
