import { RepoListenerInvocation, SdmListener } from "./Listener";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";

/**
 * Invokes when an event occurs relating to execution of a goal
 * within this SDM.
 */
export interface GoalExecutionListenerInvocation extends RepoListenerInvocation {

    /**
     * The goal that completed
     */
    completedGoal: SdmGoalEvent;

    /**
     * All goals in the goal set
     */
    allGoals: SdmGoalEvent[];
}

export type GoalExecutionListener = SdmListener<GoalExecutionListenerInvocation>;
