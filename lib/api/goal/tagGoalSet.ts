import { SdmGoalMessage } from "./SdmGoalMessage";
import { PushListenerInvocation } from "../listener/PushListener";

/**
 * Create Tags for the goal set containing the provided goals
 */
export type TagGoalSet = (goals: SdmGoalMessage[], pli: PushListenerInvocation) =>
    Promise<Array<{ name: string, value: string }> | undefined>;
