/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { ReviewListener, ReviewListenerInvocation } from "../../../src/api/listener/ReviewListener";
import { ReviewerRegistration } from "../../../src/api/registration/ReviewerRegistration";
import { TruePushTest } from "../../api/mapping/support/pushTestUtilsTest";

import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import * as assert from "power-assert";
import { executeReview } from "../../../src/api-helper/listener/executeReview";
import { fakeRunWithLogContext } from "../../../src/api-helper/test/fakeRunWithLogContext";
import { SingleProjectLoader } from "../../../src/api-helper/test/SingleProjectLoader";
import { PushReactionResponse } from "../../../src/api/registration/PushReactionRegistration";

const HatesTheWorld: ReviewerRegistration = {
    name: "hatred",
    pushTest: TruePushTest,
    action: async cri => ({
        repoId: cri.project.id,
        comments: await saveFromFiles(cri.project, "**/*", f =>
            new DefaultReviewComment("info", "hater",
                `Found a file at \`${f.path}\`: We hate all files`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    }),
    options: {considerOnlyChangedFiles: false},
};

const JustTheOne: ReviewerRegistration = {
    name: "justOne",
    pushTest: TruePushTest,
    action: async cri => ({
        repoId: cri.project.id,
        comments: [
            new DefaultReviewComment("info", "justOne",
                `One thing`,
                {
                    path: "whatever",
                    lineFrom1: 1,
                    offset: -1,
                })],
    }),
    options: {considerOnlyChangedFiles: false},
};

function loggingReviewListenerWithApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
        if (re.review.comments.length > 0) {
            return PushReactionResponse.requireApprovalToProceed;
        }
    };
}

function loggingReviewListenerWithoutApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
    };
}

describe("executeReview", () => {

    it("should be clean on empty", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld], [l]);
        const r = await ge(fakeRunWithLogContext(id));
        assert.equal(r.code, 0);
        assert(!r.requireApproval);
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 0);
    });

    it("should hate anything it finds", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld], [l]);
        const rwlc = fakeRunWithLogContext(id);
        const r = await ge(rwlc);
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
        assert(r.requireApproval);
    });

    it("should hate anything it finds, without requiring approval", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithoutApproval(reviewEvents);
        const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld], [l]);
        const rwlc = fakeRunWithLogContext(id);
        const r = await ge(rwlc);
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
        assert(!r.requireApproval);
    });

    it("consolidate reviewers", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld, JustTheOne], [l]);
        const rwlc = fakeRunWithLogContext(id);
        const r = await ge(rwlc);
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 2);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
    });

});
