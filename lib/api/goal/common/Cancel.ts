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
    Goals,
    isGoals,
} from "../Goals";
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
    goals: Array<Goal | Goals>;
    goalSetFilter?: (goalSet: string) => Promise<boolean>;
}

const DefaultCancelOptions: CancelOptions = {
    goals: [],
    goalSetFilter: async () => true,
};

/**
 * Goal to cancel pending goals in goal sets of the previous commit on the same branch
 */
export class Cancel extends FulfillableGoal {

    constructor(private readonly options: FulfillableGoalDetails & CancelOptions = DefaultCancelOptions,
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(options, DefaultGoalNameGenerator.generateName("cancel"), CancelDefinition),
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
    displayName: "cancel pending goals",
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
                uniqueNames: _.uniq(_.flatten(options.goals.map(g => {
                    if (isGoals(g)) {
                        return g.goals.map(gg => gg.uniqueName);
                    } else {
                        return g.uniqueName;
                    }
                }))),
            },
            options: QueryNoCacheOptions,
        });

        if (goals && goals.SdmGoal && goals.SdmGoal.length > 0) {
            const currentGoals = sumSdmGoalEvents(goals.SdmGoal as any) as SdmGoalByShaAndBranch.SdmGoal[];
            const cancelableGoals = currentGoals.filter(
                g => g.state === SdmGoalState.in_process ||
                    g.state === SdmGoalState.planned ||
                    g.state === SdmGoalState.requested ||
                    g.state === SdmGoalState.waiting_for_pre_approval ||
                    g.state === SdmGoalState.pre_approved)
                .filter(g => options.goalSetFilter(g.goalSet));

            if (cancelableGoals.length > 0) {
                const canceledGoalSets = _.uniq(cancelableGoals.map(g => g.goalSetId));

                for (const goal of cancelableGoals) {

                    gi.progressLog.write(
                        `Canceling goal '${goal.name} (${goal.uniqueName})' in state '${goal.state}' of goal set '${goal.goalSet} - ${goal.goalSetId}'`);

                    const updatedGoal = _.cloneDeep(goal);
                    updatedGoal.ts = Date.now();
                    updatedGoal.version = updatedGoal.version + 1;
                    updatedGoal.state = SdmGoalState.canceled;
                    updatedGoal.description = `Canceled ${goal.name}`;

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
                    description: `Canceled goals | ${canceledGoalSets.map(gs => codeLine(gs.slice(0, 7))).join(", ")}`,
                };
            }
        }

    };
}
