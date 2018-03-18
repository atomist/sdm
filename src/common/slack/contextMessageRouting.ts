import { HandlerContext, logger } from "@atomist/automation-client";
import { Destination } from "@atomist/automation-client/spi/message/MessageClient";

/**
 * Safely mutate the given HandlerContext so that it can respond even when used in
 * an EventHandler
 * @param ctx context to wrap
 * @param destinations
 * @return {HandlerContext}
 */
export function teachToRespondInEventHandler(ctx: HandlerContext, ...destinations: Destination[]): HandlerContext {
    const oldRespondMethod = ctx.messageClient.respond;
    ctx.messageClient.respond = async (msg, options) => {
        // First try routing to response. If that doesn't work, we're probably
        // in an event handler. Try linked channels.
        try {
            return await oldRespondMethod(msg, options);
        } catch (err) {
            logger.info("Rerouting response message to destinations: message was [%s]", msg);
            return ctx.messageClient.send(msg, destinations, options);
        }
    };
    return ctx;
}
