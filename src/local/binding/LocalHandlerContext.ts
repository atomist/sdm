import { AutomationContextAware, HandlerContext } from "@atomist/automation-client";
import { CommandIncoming, EventIncoming } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { AutomationContext } from "@atomist/automation-client/internal/util/cls";
import { GraphClient } from "@atomist/automation-client/spi/graph/GraphClient";
import { HttpClientMessageClient } from "../invocation/cli/io/HttpClientMessageClient";

export class LocalHandlerContext implements HandlerContext, AutomationContextAware, AutomationContext {

    public correlationId = new Date().getTime() + "_";

    // TODO need to parameterize this
    get messageClient() {
        // return new ConsoleMessageClient();
        return new HttpClientMessageClient();
    }

    get graphClient(): GraphClient {
        throw new Error("GraphClient not supported locally");
    }

    get context(): AutomationContext {
        return this;
    }

    public teamName: string = "foo";

    public operation = "whatever";

    public name = "anything";

    public version = "0.1.0";

    public invocationId = "erer";

    public ts = new Date().getTime();

    constructor(public trigger: CommandIncoming | EventIncoming,
                public readonly teamId = "T1234") {
    }

}
