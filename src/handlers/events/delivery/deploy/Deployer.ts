import { DeployableArtifact } from "../ArtifactStore";
import { QueryableProgressLog } from "../log/ProgressLog";
import { Deployment, TargetInfo } from "./Deployment";

export interface Deployer<T extends TargetInfo = TargetInfo> {

    deploy(ai: DeployableArtifact, ti: T, log: QueryableProgressLog): Promise<Deployment>;

}
