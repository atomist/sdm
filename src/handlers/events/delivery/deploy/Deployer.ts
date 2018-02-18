import { DeployableArtifact } from "../ArtifactStore";
import { QueryableProgressLog } from "../log/ProgressLog";
import { Deployment, TargetInfo } from "./Deployment";

export interface Deployer<T extends TargetInfo> {

    deploy(ai: DeployableArtifact, cfi: T, log: QueryableProgressLog): Promise<Deployment>;

}
