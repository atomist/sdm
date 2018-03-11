import { Goals } from "../../goals/Goal";
import { GoalSetter, PushTest, PushTestInvocation } from "../GoalSetter";
import { allSatisfied } from "./pushTestUtils";

/**
 * GoalSetter wholly driven by one or more PushTest instances.
 * Always returns the same goals
 */
export class GuardedGoalSetter implements GoalSetter {

    public guard: PushTest;

    /**
     * Create a GoalSetter that will always return the same goals if the guards
     * match
     * @param {Goals} goals to return if the guards return OK
     * @param {PushTest} guard1
     * @param {PushTest} guards
     */
    constructor(private goals: Goals, guard1: PushTest, ...guards: PushTest[]) {
        this.guard = allSatisfied(guard1, ...guards);
    }

    public async chooseGoals(pi: PushTestInvocation): Promise<Goals | undefined> {
        return this.goals;
    }
}
