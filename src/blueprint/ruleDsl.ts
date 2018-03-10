import { Goals } from "../common/goals/Goal";
import { GoalSetter, PushTest } from "../common/listener/GoalSetter";
import { GuardedGoalSetter } from "../common/listener/support/GuardedGoalSetter";

/**
 * Simple GoalSetter DSL
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(guard1: PushTest, ...guards: PushTest[]): { setGoals(phases: Goals): GoalSetter } {
    return {
        setGoals(phases) {
            return new GuardedGoalSetter(phases, guard1, ...guards);
        },
    };
}
