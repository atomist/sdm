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
    addressEvent,
    AutomationContextAware,
    QueryNoCacheOptions,
} from "@atomist/automation-client";
import { codeLine } from "@atomist/slack-messages";
import * as _ from "lodash";
import { sumSdmGoalEvents } from "../../../api-helper/goal/fetchGoalsOnCommit";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import {
    SdmGoalByShaAndBranch,
    SdmGoalState,
} from "../../../typings/types";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { ExecuteGoal } from "../GoalInvocation";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { GoalRootType } from "../SdmGoalMessage";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Options to configure the Cancel goal
 */
export interface CancelOptions {
    goalSetFilter?: (goalSet: string) => Promise<boolean>;
}

const DefaultCancelOptions: CancelOptions = {
    goalSetFilter: async () => true,
};

/**
 * Goal to cancel pending goals in goal sets of the previous commit on the same branch
 */
export class Cancel extends FulfillableGoal {

    constructor(private readonly options: FulfillableGoalDetails & CancelOptions,
                ...dependsOn: Goal[]) {

        super({
            ...CancelDefinition,
            ...getGoalDefinitionFrom(options, DefaultGoalNameGenerator.generateName("cancel")),
        }, ...dependsOn);

        const optsToUse: CancelOptions = {
            goalSetFilter: DefaultCancelOptions.goalSetFilter,
            ...this.options,
        };

        this.addFulfillment({
            name: `cancel-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeCancelGoalSets(optsToUse, this.definition.uniqueName),
        });
    }
}

const CancelDefinition: GoalDefinition = {
    uniqueName: "cancel",
    displayName: "cancel",
    environment: IndependentOfEnvironment,
    workingDescription: "Canceling pending goals",
    completedDescription: "No pending goals canceled",
    failedDescription: "Failed to cancel pending goals",
};

/**
 * Cancel any pending goals that are on the previous commit of the goal's branch
 * @param options
 * @param name
 */
function executeCancelGoalSets(options: CancelOptions, name: string): ExecuteGoal {
    return async gi => {

        const goals = await gi.context.graphClient.query<SdmGoalByShaAndBranch.Query, SdmGoalByShaAndBranch.Variables>({
            name: "SdmGoalByShaAndBranch",
            variables: {
                sha: gi.sdmGoal.push.before.sha,
                branch: gi.sdmGoal.branch,
                repo: gi.sdmGoal.repo.name,
                owner: gi.sdmGoal.repo.owner,
                providerId: gi.sdmGoal.repo.providerId,
            },
            options: QueryNoCacheOptions,
        });

        if (goals && goals.SdmGoal && goals.SdmGoal.length > 0) {
            const currentGoals = sumSdmGoalEvents(goals.SdmGoal as any) as SdmGoalByShaAndBranch.SdmGoal[];
            const cancelableGoals = currentGoals.filter(
                g => g.state !== SdmGoalState.in_process &&
                    g.state !== SdmGoalState.stopped &&
                    g.state !== SdmGoalState.canceled &&
                    g.state !== SdmGoalState.failure &&
                    g.state !== SdmGoalState.success)
                .filter(g => options.goalSetFilter(g.goalSet));

            const canceledGoalSets = _.uniq(cancelableGoals.map(g => g.goalSetId));

            for (const goal of cancelableGoals) {

                gi.progressLog.write(
                    `Canceling goal '${goal.uniqueName}' in state '${goal.state}' of goal set '${goal.goalSet} - ${goal.goalSetId}'`);

                const updatedGoal = _.cloneDeep(goal);
                updatedGoal.ts = Date.now();
                updatedGoal.version = updatedGoal.version + 1;
                updatedGoal.state = SdmGoalState.canceled;
                updatedGoal.description = `Canceled ${goal.name} because of newer goals`;

                const actx = gi.context as any as AutomationContextAware;
                const prov: SdmGoalByShaAndBranch.Provenance = {
                    name,
                    registration: actx.context.name,
                    version: actx.context.version,
                    correlationId: actx.context.correlationId,
                    ts: Date.now(),
                };
                updatedGoal.provenance.push(prov);

                await gi.context.messageClient.send(updatedGoal, addressEvent(GoalRootType));
            }

            return {
                code: 0,
                message: `Canceled goals | ${canceledGoalSets.map(gs => codeLine(gs)).join(", ")}`,
            };
        }

    };
}
