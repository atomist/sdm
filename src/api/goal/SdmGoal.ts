import { SdmGoalEvent } from "./SdmGoalEvent";

/**
 * @deprecated Use SdmGoalEvent for most things. If you're storing/updating a goal, use SdmGoalMessage.
 */
export type SdmGoal = SdmGoalEvent;

export { SdmGoalKey } from "./SdmGoalMessage";