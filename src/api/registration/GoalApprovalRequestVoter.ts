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