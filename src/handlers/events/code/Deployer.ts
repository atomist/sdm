
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { CloudFoundryInfo, Deployment, ProgressLog } from "./DeploymentChain";

export interface Deployer {

    // TODO CloudFoundryInfo should be Deployer specific
    deploy<P extends LocalProject>(proj: P, cfi: CloudFoundryInfo, log: ProgressLog): Promise<Deployment>;

}
