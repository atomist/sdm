import "mocha";
import * as assert from "assert";
import * as stringify from "json-stringify-safe";
import { SelfDescribeCommandName } from "../src/handlers/commands/SelfDescribe";
import { invokeCommandHandler } from "./framework/CommandHandlerInvocation";
import { TestConfig } from "./fixture";

describe("basic thereness", () => {

    it("can describe itself", async () => {
        const handlerResult = await invokeCommandHandler(TestConfig, {
            name: SelfDescribeCommandName,
            parameters: [],
        });
        assert(handlerResult.message.includes("brilliant"), "Not brilliant: " + stringify(handlerResult));
    });

});
