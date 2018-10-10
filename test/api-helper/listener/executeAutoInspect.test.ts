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

import {
    DefaultReviewComment,
    GitHubRepoRef,
    InMemoryProject,
    InMemoryProjectFile,
    projectUtils,
} from "@atomist/automation-client";
import { ExecuteGoalResult } from "../../../lib/api/goal/ExecuteGoalResult";
import { ReviewerRegistration } from "../../../lib/api/registration/ReviewerRegistration";
import { TruePushTest } from "../../api/mapping/support/pushTestUtils.test";

import * as assert from "power-assert";
import { executeAutoInspects } from "../../../lib/api-helper/listener/executeAutoInspects";
import { fakeGoalInvocation } from "../../../lib/api-helper/testsupport/fakeGoalInvocation";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";
import {
    ReviewListener,
    ReviewListenerInvocation,
} from "../../../lib/api/listener/ReviewListener";
import { PushImpactResponse } from "../../../lib/api/registration/PushImpactListenerRegistration";

const HatesTheWorld: ReviewerRegistration = {
    name: "hatred",
    pushTest: TruePushTest,
    inspection: async project => ({
        repoId: project.id,
        comments: await projectUtils.gatherFromFiles(project, "**/*", async f =>
            new DefaultReviewComment("info", "hater",
                `Found a file at \`${f.path}\`: We hate all files`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    }),
    options: { considerOnlyChangedFiles: false },
};

const JustTheOne: ReviewerRegistration = {
    name: "justOne",
    pushTest: TruePushTest,
    inspection: async project => ({
        repoId: project.id,
        comments: [
            new DefaultReviewComment("info", "justOne",
                `One thing`,
                {
                    path: "whatever",
                    lineFrom1: 1,
                    offset: -1,
                })],
    }),
    options: { considerOnlyChangedFiles: false },
};

function loggingReviewListenerWithApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
        if (re.review.comments.length > 0) {
            return PushImpactResponse.requireApprovalToProceed;
        }
    };
}

function loggingReviewListenerWithoutApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
    };
}

describe("executeAutoInspects", () => {

    it("should be clean on empty", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeAutoInspects([HatesTheWorld], [{
            name: "thing",
            listener: l,
        }]);
        const r = await ge(fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any)) as ExecuteGoalResult;
        assert.equal(r.code, 0);
        assert(!r.state);
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 0);
    });

    it("should hate anything it finds", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeAutoInspects([HatesTheWorld], [{
            name: "thing",
            listener: l,
        }]);
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const r = await ge(rwlc) as ExecuteGoalResult;
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
        assert(r.state);
    });

    it("should hate anything it finds, without requiring approval", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const listener = loggingReviewListenerWithoutApproval(reviewEvents);
        const ge = executeAutoInspects([HatesTheWorld], [{
            name: "thing",
            listener,
        }]);
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const r = await ge(rwlc) as ExecuteGoalResult;
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
        assert(!r.state);
    });

    it("consolidate reviewers", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const listener = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeAutoInspects([HatesTheWorld, JustTheOne],
            [{
                name: "thing",
                listener,
            }]);
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const r = await ge(rwlc) as ExecuteGoalResult;
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 2);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
    });

});
