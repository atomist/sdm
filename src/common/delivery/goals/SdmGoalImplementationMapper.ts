import { GoalExecutor } from "./goalExecution";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { Goal } from "./Goal";
import { match } from "minimatch";

export type GoalImplementation = {
    implementationName: string,
    goal: Goal,
    goalExecutor: GoalExecutor
}

export class SdmGoalImplementationMapper {

    private mappings: GoalImplementation[] = [];

    public findBySdmGoal(goal: SdmGoal): GoalImplementation {
        const matchedNames =  this.mappings.filter(m => m.implementationName === goal.implementation.name);
        if (matchedNames.length > 1) {
            throw new Error("Multiple mappings for name " + goal.implementation.name);
        }
        if (matchedNames.length === 0) {
            throw new Error("No implementation found with name " + goal.implementation.name)
        }
        return matchedNames[0];
    }

    public addImplementation(implementation: GoalImplementation): void {
        this.mappings.push(implementation);
    }
}