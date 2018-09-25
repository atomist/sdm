import {
    GitProject,
    Success,
} from "@atomist/automation-client";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
} from "../../api/goal/GoalInvocation";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import {
    ProjectLoader,
    ProjectLoadingParameters,
    WithLoadedProject,
} from "../../spi/project/ProjectLoader";
import { updateGoal } from "../goal/storeGoals";
import { serializeResult } from "../misc/result";

/**
 * ProjectLoader implementation that invokes GoalProjectListener instances on the loaded project.
 * Can be used to restore state into a project/workspace area.
 */
export class ProjectListenerInvokingProjectLoader implements ProjectLoader {

    constructor(private readonly gi: GoalInvocation,
                private readonly listeners: GoalProjectListenerRegistration[]) {
    }

    public async doWithProject(params: ProjectLoadingParameters, action: WithLoadedProject): Promise<any> {
        return this.gi.configuration.sdm.projectLoader.doWithProject(params, async p => {

            let result;
            try {

                // invoke the before_action listeners
                const beforeResult = await this.invokeListeners(p, GoalProjectListenerEvent.before_action);
                if (beforeResult && beforeResult.code !== 0) {
                    return beforeResult;
                }

                // invoke the wrapped action
                result = await action(p);

            } catch (err) {
                throw err;
            } finally {
                // invoke the before_action listeners
                const afterResult = await this.invokeListeners(p, GoalProjectListenerEvent.after_action);
                if (afterResult && afterResult.code !== 0) {
                    result = afterResult;
                }
            }
            return result;
        });
    }

    private async invokeListeners(p: GitProject,
                                  event: GoalProjectListenerEvent): Promise<ExecuteGoalResult> {
        const pli: PushListenerInvocation = {
            addressChannels: this.gi.addressChannels,
            context: this.gi.context,
            credentials: this.gi.credentials,
            id: this.gi.id,
            project: p,
            push: this.gi.sdmGoal.push,
        };

        let result;
        for (const lr of this.listeners) {
            if (await lr.pushTest.mapping(pli)) {

                this.gi.progressLog.write("/--");
                this.gi.progressLog.write(`Invoking project listener: ${lr.name}`);

                await updateGoal(
                    this.gi.context,
                    this.gi.sdmGoal,
                    {
                        state: this.gi.sdmGoal.state,
                        phase: lr.name,
                        description: this.gi.sdmGoal.description,
                        url: this.gi.sdmGoal.url,
                    });

                const postResult = await lr.listener(p, this.gi, event);

                this.gi.progressLog.write(`Result: ${serializeResult(postResult)}`);
                this.gi.progressLog.write("\\--");

                if (postResult && postResult.code !== 0) {
                    result = postResult;
                    break;
                }
            }
        }
        return Success;
    }
}
