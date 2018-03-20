/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as assert from "power-assert";
import { checkstyleReviewer } from "../../../../../../src/common/delivery/code/review/checkstyle/checkstyleReviewer";
import { ReviewerError } from "../../../../../../src/common/delivery/code/review/ReviewerError";

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
