import { ChildProcess } from "child_process";
import { addressChannelsFor, HasChannels } from "../../commands/editors/toclient/addressChannels";
import { HandlerContext } from "@atomist/automation-client";

export interface ProgressLog {
    write(what: string): void;
}

export const DevNullProgressLog: ProgressLog = {
    write() {
        // Do nothing
    },
};

export function slackProgressLog(hasChannels: HasChannels, ctx: HandlerContext): ProgressLog {
    const add = addressChannelsFor(hasChannels, ctx);
    return {
        write(msg) {
            add(msg);
        },
    };
}

export interface Deployment {

    childProcess: ChildProcess;
    url: string;
}

export interface CloudFoundryInfo {

    api: string;
    username: string;
    password: string;
    space: string;
    org: string;

}

/**
 * Info to send up for a cloud foundry deployment
 */
export interface AppInfo {

    name: string;
    version: string;
}

export const PivotalWebServices = { // : Partial<CloudFoundryInfo> = {

    api: "https://api.run.pivotal.io",
};
