
import { HandlerContext } from "@atomist/automation-client";
import { addressChannelsFor, HasChannels } from "../../handlers/commands/editors/toclient/addressChannels";
import { ProgressLog } from "./ProgressLog";

export function slackProgressLog(hasChannels: HasChannels, ctx: HandlerContext): ProgressLog {
    const add = addressChannelsFor(hasChannels, ctx);
    return {
        write(msg) {
            add(msg);
        },
        flush() { return Promise.resolve(); },
        close() { return Promise.resolve(); },
    };
}
