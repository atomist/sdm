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

import { Severity } from "@atomist/automation-client";
import * as assert from "power-assert";
import {
    ApproveGoalIfErrorComments,
    ApproveGoalIfWarnComments,
    FailGoalIfErrorComments,
    FailGoalIfWarnComments,
    severityReviewListener,
} from "../../../../lib/api-helper/code/review/goalReviewListener";
import { ReviewListenerInvocation } from "../../../../lib/api/listener/ReviewListener";
import { PushImpactResponse } from "../../../../lib/api/registration/PushImpactListenerRegistration";

describe("goalReviewListener", () => {

    describe("severityReviewListener", () => {

        it("should return the appropriate push impact response", async () => {
            const pirs: PushImpactResponse[] = [PushImpactResponse.failGoals, PushImpactResponse.requireApprovalToProceed];
            const severities: Severity[] = ["info", "warn", "error"];
            for (const pir of pirs) {
                for (const severity of severities) {
                    const rli: ReviewListenerInvocation = { review: { comments: [{ severity }] } } as any;
                    const r = await severityReviewListener(pir, severity)(rli);
                    assert(r === pir);
                    for (const otherSeverity of severities) {
                        if (otherSeverity !== severity) {
                            const orli: ReviewListenerInvocation = { review: { comments: [{ otherSeverity }] } } as any;
                            const or = await severityReviewListener(pir, severity)(orli);
                            assert(or === PushImpactResponse.proceed);
                        }
                    }
                }
            }
        });

        it("should proceed if there are no comments", async () => {
            const rli: ReviewListenerInvocation = {
                review: { comments: [] },
            } as any;
            const r = await severityReviewListener(PushImpactResponse.failGoals)(rli);
            assert(r === PushImpactResponse.proceed);
        });

    });

    describe("FailGoalIfErrorComments", () => {

        it("should proceed if no error comments exists", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                    ],
                },
            } as any;
            const r = await FailGoalIfErrorComments.listener(rli);
            assert(r === PushImpactResponse.proceed);
        });

        it("should find an error in several comments", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                    ],
                },
            } as any;
            const r = await FailGoalIfErrorComments.listener(rli);
            assert(r === PushImpactResponse.failGoals);
        });

    });

    describe("ApproveGoalIfErrorComments", () => {

        it("should proceed if no error comments exists", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                    ],
                },
            } as any;
            const r = await ApproveGoalIfErrorComments.listener(rli);
            assert(r === PushImpactResponse.proceed);
        });

        it("should find an error in several comments", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                    ],
                },
            } as any;
            const r = await ApproveGoalIfErrorComments.listener(rli);
            assert(r === PushImpactResponse.requireApprovalToProceed);
        });

    });

    describe("FailGoalIfWarnComments", () => {

        it("should proceed if no warn comments exists", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "info" },
                    ],
                },
            } as any;
            const r = await FailGoalIfWarnComments.listener(rli);
            assert(r === PushImpactResponse.proceed);
        });

        it("should find an warn in several comments", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                    ],
                },
            } as any;
            const r = await FailGoalIfWarnComments.listener(rli);
            assert(r === PushImpactResponse.failGoals);
        });

    });

    describe("ApproveGoalIfWarnComments", () => {

        it("should proceed if no warn comments exists", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "info" },
                    ],
                },
            } as any;
            const r = await ApproveGoalIfWarnComments.listener(rli);
            assert(r === PushImpactResponse.proceed);
        });

        it("should find an warn in several comments", async () => {
            const rli: ReviewListenerInvocation = {
                review: {
                    comments: [
                        { severity: "warn" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                        { severity: "info" },
                        { severity: "warn" },
                        { severity: "error" },
                    ],
                },
            } as any;
            const r = await ApproveGoalIfWarnComments.listener(rli);
            assert(r === PushImpactResponse.requireApprovalToProceed);
        });

    });

});
