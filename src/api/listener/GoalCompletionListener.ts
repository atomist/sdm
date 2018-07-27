import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { RepoListenerInvocation, SdmListener } from "./Listener";

/**
 * Invocation on goal that has succeeded or failed.
 * This could come from any SDM. GoalExecutionListener focuses only on goals
 * from the present SDM.
 */
export interface GoalCompletionListenerInvocation extends RepoListenerInvocation {
    completedGoal: SdmGoalEvent;
    allGoals: SdmGoalEvent[];
}

export type GoalCompletionListener = SdmListener<GoalCompletionListenerInvocation>;
