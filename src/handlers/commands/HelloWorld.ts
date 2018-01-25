import { failure, HandleCommand, HandlerContext, Success } from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/decorators";
import { SlackMessage } from "@atomist/slack-messages";

@CommandHandler("A simple hello world", "hello world")
export class HelloWorld implements HandleCommand {

    public handle(ctx: HandlerContext): Promise<any> {
        const msg: SlackMessage = {
            text: "Hell World!",
        };
        return ctx.messageClient.respond(msg)
            .then(() => Success, failure);
    }

}
