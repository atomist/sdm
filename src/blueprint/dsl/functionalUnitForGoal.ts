import { Goal, hasPreconditions } from "../../common/delivery/goals/Goal";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { ExecuteGoalOnSuccessStatus } from "../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { ExecuteGoalOnRequested } from "../../handlers/events/delivery/ExecuteGoalOnRequested";
import { triggerGoal } from "../../handlers/commands/triggerGoal";
import { HandleEvent } from "@atomist/automation-client";
import { GoalExecutor } from "../../common/delivery/goals/goalExecution";
import { FunctionalUnit } from "../FunctionalUnit";

export function functionalUnitForGoal(implementationName: string, goal: Goal, executor: GoalExecutor): FunctionalUnit {
    const eventHandlers: Array<Maker<HandleEvent<any>>> = [
        () => new ExecuteGoalOnRequested(implementationName, goal, executor, true),
    ];
    if (hasPreconditions(goal)) {
        eventHandlers.push(() => new ExecuteGoalOnSuccessStatus(implementationName, goal, executor, true));
    }
    return {
        eventHandlers,
        commandHandlers: [() => triggerGoal(implementationName, goal)],
    };
}