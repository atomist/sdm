import { Goal } from "../goal/Goal";
import { Goals, isGoals } from "../goal/Goals";

/**
 * Type used in constructing goals
 */
export type GoalComponent = Goal | Goal[] | Goals;

export function toGoals(gc: GoalComponent): Goals {
    return isGoals(gc) ? gc :
        Array.isArray(gc) ? new Goals(gc.map(g => g.name).join("/"), ...gc) :
            new Goals("Solely " + gc.name, gc);
}
