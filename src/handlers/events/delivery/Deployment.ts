import { ChildProcess } from "child_process";

export interface Deployment {

    childProcess: ChildProcess;
    url: string;
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
