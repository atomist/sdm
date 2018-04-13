import { AllFiles } from "@atomist/automation-client/project/fileGlobs";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { CodeReactionInvocation } from "../../../../../../src/common/listener/CodeReactionListener";
import * as assert from "power-assert";
import { regexpReviewer } from "../../../../../../src/common/delivery/code/review/support/regexpReviewer";
import { ReviewerRegistration } from "../../../../../../src/common/delivery/code/review/ReviewerRegistration";

describe("regexpReviewer", () => {

    it("should not find anything", async () => {
        const rer: ReviewerRegistration = regexpReviewer("name",
            {globPattern: AllFiles},
            {
                antiPattern: /t.*/,
                shouldBe: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("a", "b"));
        const rr = await rer.action({project} as any as CodeReactionInvocation);
        assert(rr.comments.length === 0);
    });

    it("should find something", async () => {
        const rer: ReviewerRegistration = regexpReviewer("name",
            {globPattern: AllFiles},
            {
                antiPattern: /t.*/,
                shouldBe: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("thing", "b test"));
        const rr = await rer.action({project} as any as CodeReactionInvocation);
        assert.equal(rr.comments.length, 1);
        assert.equal(rr.comments[0].sourceLocation.path, "thing");
    });

});
