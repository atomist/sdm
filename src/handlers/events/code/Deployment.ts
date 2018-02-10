import { ChildProcess } from "child_process";

export interface Deployment {

    childProcess: ChildProcess;
    url: string;
}

export interface TargetInfo {

}

export interface CloudFoundryInfo extends TargetInfo {

    api: string;
    username: string;
    password: string;
    space: string;
    org: string;

}

/**
 * Info to send up for a deployment
 */
export interface AppInfo {

    name: string;
    version: string;
}

export const PivotalWebServices = { // : Partial<CloudFoundryInfo> = {

    api: "https://api.run.pivotal.io",
};
