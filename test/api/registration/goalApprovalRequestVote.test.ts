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

import * as assert from "power-assert";
import {
    GoalApprovalRequestVote,
    UnanimousGoalApprovalRequestVoteDecisionManager,
} from "../../../lib/api/registration/goalApprovalRequestVote";

describe("goalApprovalRequestVote", () => {

    describe("UnanimousGoalApprovalRequestVoteDecisionManager", () => {

        const vote = (vote: GoalApprovalRequestVote) => {
            return {
                vote,
                reason: `Voted ${vote}`,
            };
        };

        it("should vote granted for single granted vote", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Granted));
            assert.equal(result, GoalApprovalRequestVote.Granted);
        });

        it("should vote denied for single denied vote", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Denied));
            assert.equal(result, GoalApprovalRequestVote.Denied);
        });

        it("should vote abstain for single abstain vote", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Abstain));
            assert.equal(result, GoalApprovalRequestVote.Abstain);
        });

        it("should vote granted for granted votes", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Granted),
                vote(GoalApprovalRequestVote.Granted),
                vote(GoalApprovalRequestVote.Granted));
            assert.equal(result, GoalApprovalRequestVote.Granted);
        });

        it("should vote denied for single denied vote", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Granted),
                vote(GoalApprovalRequestVote.Denied),
                vote(GoalApprovalRequestVote.Granted));
            assert.equal(result, GoalApprovalRequestVote.Denied);
        });

        it("should vote denied for denied votes", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Denied),
                vote(GoalApprovalRequestVote.Denied),
                vote(GoalApprovalRequestVote.Denied));
            assert.equal(result, GoalApprovalRequestVote.Denied);
        });

        it("should vote abstain for abstain and granted votes", () => {
            const result = UnanimousGoalApprovalRequestVoteDecisionManager(
                vote(GoalApprovalRequestVote.Abstain),
                vote(GoalApprovalRequestVote.Granted),
                vote(GoalApprovalRequestVote.Granted));
            assert.equal(result, GoalApprovalRequestVote.Abstain);
        });

    });

});
