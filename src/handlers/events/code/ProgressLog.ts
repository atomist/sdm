import { HandlerContext } from "@atomist/automation-client";
import { addressChannelsFor, HasChannels } from "../../commands/editors/toclient/addressChannels";

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
