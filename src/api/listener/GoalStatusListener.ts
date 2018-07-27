import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { RepoListenerInvocation, SdmListener } from "./Listener";

/**
 * Invokes when an event occurs relating to execution of a goal
 * within this SDM.
 */
export interface GoalExecutionListenerInvocation extends RepoListenerInvocation {

    /**
     * The goal that changed state
     */
    goalEvent: SdmGoalEvent;

    error?: Error;

}

export type GoalExecutionListener = SdmListener<GoalExecutionListenerInvocation>;
