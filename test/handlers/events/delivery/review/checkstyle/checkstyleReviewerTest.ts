import "mocha";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import * as assert from "power-assert";
import {
    checkstyleReviewer,
} from "../../../../../../src/handlers/events/delivery/scan/review/checkstyle/checkstyleReviewer";
import { ReviewerError } from "../../../../../../src/blueprint/ReviewerError";

//const checkstylePath = process.env.CHECKSTYLE_PATH;
const CheckstylePath = "/Users/jessitron/Downloads/checkstyle-8.8-all.jar";

//const LocalCloneOfSeed = "/Users/rodjohnson/temp/spring-rest-seed";
const LocalCloneOfSeed = "/Users/jessitron/code/spring-team/spring-rest-seed";

describe("checkstyleReviewer", () => {

    it.skip("should work", async () => {
        const id = new GitHubRepoRef("atomist-seeds", "spring-rest-seed");
        const p = new NodeFsLocalProject(id, LocalCloneOfSeed);
        const review = await checkstyleReviewer(CheckstylePath)(p, null);
        assert(!!review);
        assert(review.comments.length === 10);
        console.log(JSON.stringify(review));
    });

    it.skip("should report problem", (done) => {
        const id = new GitHubRepoRef("atomist-seeds", "spring-rest-seed");
        const p = new NodeFsLocalProject(id, LocalCloneOfSeed);
        checkstyleReviewer("not-a-thing")(p, null).then(
            unexpectedSuccess => assert(false, "This should have failed"),
            (err: ReviewerError) =>
                assert(err.stderr.includes("Unable to access jarfile not-a-thing")
        )).then(() => done(), done);
    })

});
