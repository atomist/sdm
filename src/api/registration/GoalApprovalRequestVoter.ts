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

import { RepoContext } from "../context/SdmContext";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";

/**
 * Represents a vote on a approval request.
 */
export enum GoalApprovalRequestVote {

    /**
     * Voter decided to abstain from voting.
     */
    Abstain,

    /**
     * Voter decided to grant the approval request.
     */
    Granted,

    /**
     * Voter decided to deny the approval request.
     */
    Denied,
}

/**
 * Result from executing GoalApprovalRequestVoter.
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
     * Goal that was requested for approval.
     */
    goal: SdmGoalEvent;
}

/**
 * Voter on a request to approve a goal.
 */
export type GoalApprovalRequestVoter =
    (garvi: GoalApprovalRequestVoterInvocation) => Promise<GoalApprovalRequestVoteResult>;
