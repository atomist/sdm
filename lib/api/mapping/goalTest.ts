import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { PushListenerInvocation } from "../listener/PushListener";
import { PushTest } from "./PushTest";

/**
 * Extension to PushTest to pre-condition on SDM goal events, so called GoalTests
 */
export interface GoalTest extends PushTest {

    goalMapping: (goal: SdmGoalEvent) => Promise<boolean>;
    pushMapping: (pli: PushListenerInvocation) => Promise<boolean>;

}

export function goalTest(name: string,
                         goalMapping: (goal: SdmGoalEvent) => Promise<boolean>,
                         pushMapping: (pli: PushListenerInvocation) => Promise<boolean> = async () => true): GoalTest {
    return {
        name,
        // Always return false as this shouldn't be scheduled on pushes
        mapping: async () => false,
        // Safe goal and push mapping for later
        goalMapping,
        pushMapping,
    }
}
