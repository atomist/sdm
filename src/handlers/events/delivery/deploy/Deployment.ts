import { ChildProcess } from "child_process";

export interface DeploymentInfo {
    readonly endpoint?: string;
}

export interface Deployment {

    childProcess: ChildProcess;

    /**
     * Undefined until deployment is complete, or if it fails
     */
    deploymentInfo: DeploymentInfo;

    complete: boolean;

}

export class SimpleDeploymentInfo implements Deployment {

    public deploymentInfo: DeploymentInfo;
    public complete: boolean;

    constructor(public childProcess: ChildProcess) {
    }
}

export interface TargetInfo {

    name: string;
    description: string;
}

/**
 * Info to send up for a deployment
 */
export interface AppInfo {

    name: string;
    version: string;
}
