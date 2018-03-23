import { HandlerContext, } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Goal, } from "./Goal";
import { storeGoal } from "./storeGoals";

/**
 * Represents goals set in response to a push
 */
export class Goals {

    public readonly goals: Goal[];

    constructor(public name: string, ...goals: Goal[]) {
        this.goals = goals;
    }

    public setAllToPending(id: GitHubRepoRef,
                           creds: ProjectOperationCredentials,
                           context: HandlerContext,
                           providerId: string): Promise<any> {

        return Promise.all([
            ...this.goals.map(goal => storeGoal(context, {goalSet: this.name, goal, state: "planned", id, providerId})),
        ]);
    }
}
