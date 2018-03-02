
import { HandlerContext } from "@atomist/automation-client";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { addressChannelsFor, HasChannels } from "../slack/addressChannels";

/**
 * Stream the ProgressLog output to any Slack channels associated
 * with the current model element (such a repo)
 * @param {HasChannels} hasChannels
 * @param {HandlerContext} ctx
 * @return {ProgressLog}
 */
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
