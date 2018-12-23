/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import { AnyPush } from "../../api/mapping/support/commonPushTests";
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

                // invoke the before listeners
                const beforeResult = await this.invokeListeners(p, GoalProjectListenerEvent.before);
                if (beforeResult && beforeResult.code !== 0) {
                    return beforeResult;
                }

                // invoke the wrapped action
                result = await action(p);

            } catch (err) {
                throw err;
            } finally {
                // invoke the after listeners
                const afterResult = await this.invokeListeners(p, GoalProjectListenerEvent.after);
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
            push: this.gi.goalEvent.push,
        };

        for (const lr of this.listeners) {
            const pushTest = lr.pushTest || AnyPush;
            const events = lr.events || [GoalProjectListenerEvent.before, GoalProjectListenerEvent.after];
            if (events.includes(event) && await pushTest.mapping(pli)) {

                this.gi.progressLog.write("/--");
                this.gi.progressLog.write(`Invoking ${event} project listener: ${lr.name}`);

                await updateGoal(
                    this.gi.context,
                    this.gi.goalEvent,
                    {
                        state: this.gi.goalEvent.state,
                        phase: lr.name,
                        description: this.gi.goalEvent.description,
                        url: this.gi.goalEvent.url,
                    });

                const postResult = await lr.listener(p, this.gi, event);

                this.gi.progressLog.write(`Result: ${postResult ? serializeResult(postResult) : "Success"}`);
                this.gi.progressLog.write("\\--");

                if (postResult && postResult.code !== 0) {
                    return postResult;
                }
            }
        }
        return Success;
    }
}
