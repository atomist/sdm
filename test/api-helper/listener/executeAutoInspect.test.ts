/*
 * Copyright © 2019 Atomist, Inc.
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
import * as assert from "power-assert";
import { executeAutoInspects } from "../../../lib/api-helper/listener/executeAutoInspects";
import { fakeGoalInvocation } from "../../../lib/api-helper/testsupport/fakeGoalInvocation";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";
import { ExecuteGoalResult } from "../../../lib/api/goal/ExecuteGoalResult";
import {
    ReviewListener,
    ReviewListenerInvocation,
} from "../../../lib/api/listener/ReviewListener";
import { AutoInspectRegistration } from "../../../lib/api/registration/AutoInspectRegistration";
import { PushImpactResponse } from "../../../lib/api/registration/PushImpactListenerRegistration";
import { ReviewerRegistration } from "../../../lib/api/registration/ReviewerRegistration";
import { TruePushTest } from "../../api/mapping/support/pushTestUtils.test";

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
};

function loggingReviewListenerWithApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
        if (re.review.comments.length > 0) {
            return PushImpactResponse.requireApprovalToProceed;
        }
        return undefined;
    };
}

function loggingReviewListenerWithoutApproval(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
    };
}

function loggingReviewListenerFailingTheGoal(saveTo: ReviewListenerInvocation[]): ReviewListener {
    return async re => {
        saveTo.push(re);
        return PushImpactResponse.failGoals;
    };
}

describe("executeAutoInspects", () => {

    it("should be clean on empty", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const reviewEvents: ReviewListenerInvocation[] = [];
        const l = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeAutoInspects({
            registrations: [HatesTheWorld],
            listeners: [{
                name: "thing",
                listener: l,
            }],
            reportToSlack: true,
        });
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
        const ge = executeAutoInspects({
            registrations: [HatesTheWorld],
            listeners: [{
                name: "thing",
                listener: l,
            }],
            reportToSlack: true,
        });
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const r = await ge(rwlc) as ExecuteGoalResult;
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(reviewEvents[0].addressChannels, rwlc.addressChannels);
        assert.equal(r.code, 0);
        assert(!!r.description);
        assert(r.description.includes("1 review comment"));
        assert(r.state);
    });

    it("should find push", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const errors: string[] = [];
        const reg: AutoInspectRegistration<void> = {
            name: "reg",
            inspection: async (project, ci) => {
                if (project !== p) {
                    errors.push("Project not the same");
                }
                if (!ci.push || ci.push.push !== rwlc.goalEvent.push) {
                    errors.push("push should not be set");
                }
                assert(!ci);
            },
        };
        const ge = executeAutoInspects({ registrations: [reg], listeners: [], reportToSlack: true });

        await ge(rwlc);
        assert.deepEqual(errors, []);
    });

    it("should hate anything it finds, without requiring approval", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const listener = loggingReviewListenerWithoutApproval(reviewEvents);
        const ge = executeAutoInspects({
            registrations: [HatesTheWorld],
            listeners: [{
                name: "thing",
                listener,
            }], reportToSlack: true,
        });
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

    it("should hate anything it finds and return a goal failure", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const listener = loggingReviewListenerFailingTheGoal(reviewEvents);
        const ge = executeAutoInspects({
            registrations: [HatesTheWorld], listeners: [{
                name: "thing",
                listener,
            }], reportToSlack: true,
        });
        const rwlc = fakeGoalInvocation(id, {
            projectLoader: new SingleProjectLoader(p),
        } as any);
        const r = await ge(rwlc) as ExecuteGoalResult;
        assert.equal(reviewEvents.length, 1);
        assert.equal(reviewEvents[0].review.comments.length, 1);
        assert.equal(r.code, 1);
        assert(!r.state);
    });

    it("consolidate reviewers", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id, new InMemoryProjectFile("thing", "1"));
        const reviewEvents: ReviewListenerInvocation[] = [];
        const listener = loggingReviewListenerWithApproval(reviewEvents);
        const ge = executeAutoInspects({
            registrations: [HatesTheWorld, JustTheOne],
            listeners: [{
                name: "thing",
                listener,
            }], reportToSlack: true,
        });
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
