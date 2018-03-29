import "mocha";
import { DefaultSmokeTestConfig, SmokeTestConfig } from "./config";
import * as assert from "assert";
import * as stringify from "json-stringify-safe";
import { SelfDescribeCommandName } from "../src/handlers/commands/SelfDescribe";
import { AffirmationEditorName } from "../src/software-delivery-machine/commands/editors/demo/affirmationEditor";
import { editorOneInvocation, invokeCommandHandler } from "./framework/CommandHandlerInvocation";

const testConfig: SmokeTestConfig = DefaultSmokeTestConfig;

const GithubOrg = "spring-team";

describe("local SDM", () => {

    describe("basic thereness", () => {

        it("can describe itself", async () => {
            const handlerResult = await invokeCommandHandler(testConfig, {
                name: SelfDescribeCommandName,
                parameters: [],
            });
            assert(handlerResult.message.includes("brilliant"), "Not brilliant: " + stringify(handlerResult));
        });

    });

    describe("test against existing project", () => {

        it("changes readme", async () => {
            const handlerResult = await invokeCommandHandler(testConfig,
                editorOneInvocation(AffirmationEditorName, GithubOrg, "losgatos1"));
        }).timeout(10000);

    });

});
