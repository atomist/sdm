import { GoalExecutor } from "./goalExecution";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { Goal } from "./Goal";

export type GoalImplementation = {
    implementationName: string,
    goal: Goal,
    goalExecutor: GoalExecutor
}

export class SdmGoalImplementationMapper {

    private mappings: GoalImplementation[] = [];

    public findBySdmGoal(goal: SdmGoal): GoalImplementation {
        return this.mappings[0];
    }

    public addImplementation(implementation: GoalImplementation): void {
        this.mappings.push(implementation);
    }
}