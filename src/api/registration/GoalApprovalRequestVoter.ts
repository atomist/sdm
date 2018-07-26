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


import { SdmGoalEvent } from "../../index";

/**
 * Result from executing GoalApprovalRequestVoter.
 */
export enum GoalApprovalRequestVoteResult {

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
 * Vote on a request to approve a goal.
 */
export type GoalApprovalRequestVote = (goal: SdmGoalEvent) => Promise<GoalApprovalRequestVoteResult>;

/**
 * Type to register GoalApprovalRequestVoter instances with the SDM.
 * @see SoftwareDeliveryMachine.addGoalApprovalRequestVoter
 */
export interface GoalApprovalRequestVoterRegistration  {

    /**
     * Function to vote on the approval request.
     */
    vote: GoalApprovalRequestVote
}