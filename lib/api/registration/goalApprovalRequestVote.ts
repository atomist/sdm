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

import { logger } from "@atomist/automation-client/lib/util/logger";
import { RepoContext } from "../context/SdmContext";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";

/**
 * Represents a vote on a approval request
 */
export enum GoalApprovalRequestVote {

    /**
     * Voter decided to abstain from voting
     */
    Abstain = "abstain",

    /**
     * Voter decided to grant the approval request
     */
    Granted = "granted",

    /**
     * Voter decided to deny the approval request
     */
    Denied = "denied",
}

/**
 * Result from executing GoalApprovalRequestVoter
 */
export interface GoalApprovalRequestVoteResult {

    /**
     * The vote
     */
    vote: GoalApprovalRequestVote;

    /**
     * Optional text describing why the decision was being made
     */
    reason?: string;
}

/**
 * Invocation of a GoalApprovalRequestVoter
 */
export interface GoalApprovalRequestVoterInvocation extends RepoContext {

    /**
     * Goal that was requested for approval
     */
    goal: SdmGoalEvent;
}

/**
 * Voter on a request to approve a goal
 */
export type GoalApprovalRequestVoter =
    (garvi: GoalApprovalRequestVoterInvocation) => Promise<GoalApprovalRequestVoteResult>;

/**
 * Decide resulting vote on a set of votes
 */
export type GoalApprovalRequestVoteDecisionManager =
    (...votes: GoalApprovalRequestVoteResult[]) => GoalApprovalRequestVote;

/**
 * Default GoalApprovalRequestVoteDecisionManager that decides unanimously on votes.
 * One denied vote will deny the approval request; all granted votes with grant the request.
 * All other votes with result in an abstained approval request.
 * @param votes
 */
export const UnanimousGoalApprovalRequestVoteDecisionManager: GoalApprovalRequestVoteDecisionManager =
    (...votes: GoalApprovalRequestVoteResult[]) => {
        logger.debug(`Deciding on provided votes '${votes.map(v => v.vote).join(", ")}'`);
        if (votes.some(v => v.vote === GoalApprovalRequestVote.Denied)) {
            logger.debug("At least one denied vote. Denying approval request");
            return GoalApprovalRequestVote.Denied;
        } else if (!votes.some(v => v.vote !== GoalApprovalRequestVote.Granted)) {
            logger.debug("All votes granted. Granting approval request");
            return GoalApprovalRequestVote.Granted;
        } else {
            logger.debug("Some abstain and granted votes. Abstaining approval request");
            return GoalApprovalRequestVote.Abstain;
        }
    };
