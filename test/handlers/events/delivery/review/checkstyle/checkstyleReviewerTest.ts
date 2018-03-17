import "mocha";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as assert from "power-assert";
import { ReviewerError } from "../../../../../../src/blueprint/ReviewerError";
import { checkstyleReviewer } from "../../../../../../src/common/delivery/code/review/checkstyle/checkstyleReviewer";

const checkstylePath = process.env.CHECKSTYLE_PATH;

describe("checkstyleReviewer", () => {

    it("should succeed in reviewing review", async () => {
        const p = await GitCommandGitProject.cloned({ token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const review = await checkstyleReviewer(checkstylePath)(p, null);
        assert(!!review);
        assert(review.comments.length > 1);
        console.log(JSON.stringify(review));
    }).timeout(10000);

    it("should handle invalid checkstyle path", async () => {
        const p = await GitCommandGitProject.cloned({ token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        checkstyleReviewer("invalid checkstyle path")(p, null).then(
            unexpectedSuccess => assert(false, "This should have failed"),
            (err: ReviewerError) =>
                assert(err.stderr.includes("Unable to access jarfile not-a-thing"),
        ));
    }).timeout(10000);

});
