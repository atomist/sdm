import { PushListenerInvocation } from "../listener/PushListener";
import { SdmGoalMessage } from "./SdmGoalMessage";

/**
 * Enrich provided goal before it gets persisted and planned
 */
export type EnrichGoal = (goal: SdmGoalMessage, pli: PushListenerInvocation) => Promise<SdmGoalMessage>;
