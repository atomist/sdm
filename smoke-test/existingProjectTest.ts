import "mocha";
import { AffirmationEditorName } from "../src/software-delivery-machine/commands/editors/demo/affirmationEditor";
import { editorOneInvocation, invokeCommandHandler } from "./framework/CommandHandlerInvocation";
import { TestConfig } from "./fixture";

const RepoToTest = "losgatos1";

describe("test against existing project", () => {

        it("changes readme", async () => {
            const handlerResult = await invokeCommandHandler(TestConfig,
                editorOneInvocation(AffirmationEditorName, TestConfig.githubOrg, RepoToTest));
        }).timeout(10000);

    });
