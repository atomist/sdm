import { GoalExecutor } from "./goalExecution";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { Goal } from "./Goal";

type SdmGoalImplementationMapping = {
    implementationName: string, goal: Goal, goalExecutor: GoalExecutor
}

export class SdmGoalImplementationMapper {

    private mappings: SdmGoalImplementationMapping[] = [];

    public findGoalExecutor(goal: SdmGoal): { goal: Goal, goalExecutor: GoalExecutor } {
        throw new Error("Not implemented");
    }

    public implement(implementationName: string, goal: Goal, goalExecutor: GoalExecutor): void {
        this.mappings.push( {
            implementationName, goal, goalExecutor
        });
    }
}