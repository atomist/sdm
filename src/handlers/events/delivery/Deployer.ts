import { DeployableArtifact } from "./ArtifactStore";
import { Deployment, TargetInfo } from "./Deployment";
import { ProgressLog } from "./ProgressLog";

export interface Deployer<T extends TargetInfo> {

    deploy(ai: DeployableArtifact, cfi: T, log: ProgressLog): Promise<Deployment>;

}
