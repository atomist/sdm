import { GoalExecutor } from "./goalExecution";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { Goal } from "./Goal";

export type SdmGoalImplementation = {
    implementationName: string,
    goal: Goal,
    goalExecutor: GoalExecutor
}

export class SdmGoalImplementationMapper {

    private mappings: SdmGoalImplementation[] = [];

    public findBySdmGoal(goal: SdmGoal): { goal: Goal, goalExecutor: GoalExecutor } {
        throw new Error("Not implemented");
    }

    public addImplementation(implementation: SdmGoalImplementation): void {
        this.mappings.push(implementation);
    }
}