/*
 * Copyright © 2020 Atomist, Inc.
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

import { subscription } from "@atomist/automation-client/lib/graph/graphQL";
import { EventFired } from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { OnEvent } from "@atomist/automation-client/lib/onEvent";
import SdmGoalSet = InProcessSdmGoalSets.SdmGoalSet;
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import { updateGoal } from "../../../api-helper/goal/storeGoals";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import {
    InProcessSdmGoalSets,
    OnAnySdmGoalSet,
    SdmGoalFields,
    SdmGoalsByGoalSetIdAndUniqueName,
    SdmGoalState,
} from "../../../typings/types";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { SoftwareDeliveryMachineConfiguration } from "../../machine/SoftwareDeliveryMachineOptions";
import { AnyPush } from "../../mapping/support/commonPushTests";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { SdmGoalEvent } from "../SdmGoalEvent";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Options to configure the Queue goal
 */
export interface QueueOptions {
    concurrent?: number;
    fetch?: number;
}

export const DefaultQueueOptions: QueueOptions = {
    concurrent: 2,
    fetch: 10,
};

/**
 * Goal to queue current goal set until it is the first in the list and can execute
 */
export class Queue extends FulfillableGoal {

    constructor(private readonly options: FulfillableGoalDetails & QueueOptions = DefaultQueueOptions,
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(options, DefaultGoalNameGenerator.generateName("queue"), QueueDefinition),
        }, ...dependsOn);
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        super.register(sdm);

        const optsToUse: QueueOptions = {
            ...DefaultQueueOptions,
            ...this.options,
        };

        this.addFulfillment({
            name: `queue-${this.definition.uniqueName}`,
            pushTest: AnyPush,
            goalExecutor: async gi => {
                const { context, configuration, goalEvent, progressLog } = gi;
                const goalSets = await context.graphClient.query<InProcessSdmGoalSets.Query, InProcessSdmGoalSets.Variables>({
                    name: "InProcessSdmGoalSets",
                    variables: {
                        fetch: optsToUse.fetch + optsToUse.concurrent,
                        offset: 0,
                        registration: [configuration.name],
                    },
                    options: QueryNoCacheOptions,
                });

                if (!!goalSets && !!goalSets.SdmGoalSet) {
                    const ix = goalSets.SdmGoalSet.findIndex(gs => gs.goalSetId === goalEvent.goalSetId);
                    if (ix >= 0) {
                        progressLog.write(`Goal set currently at position ${ix + 1} in queue`);
                        if (ix < optsToUse.concurrent) {
                            progressLog.write(`Goal set can start immediately`);
                            return {
                                state: SdmGoalState.success,
                            };
                        }
                    } else {
                        progressLog.write(`Goal set not currently pending`);
                    }
                }
                return {
                    state: SdmGoalState.in_process,
                };
            },
            logInterpreter: LogSuppressor,
        });

        sdm.addEvent({
            name: `OnAnySdmGoalSet`,
            description: `Handle queuing for goal ${this.definition.uniqueName}`,
            subscription: subscription({
                name: "OnAnySdmGoalSet",
                variables: {
                    registration: [sdm.configuration.name] as any,
                },
            }),
            listener: handleSdmGoalSetEvent(optsToUse, this.definition, sdm.configuration),
        });
    }
}

const QueueDefinition: GoalDefinition = {
    uniqueName: "queue",
    displayName: "queue goals",
    environment: IndependentOfEnvironment,
    workingDescription: "Queued",
    completedDescription: "Started goals",
    failedDescription: "Failed to queue goals",
};

export function handleSdmGoalSetEvent(options: QueueOptions,
                                      definition: GoalDefinition,
                                      configuration: SoftwareDeliveryMachineConfiguration): OnEvent<OnAnySdmGoalSet.Subscription> {
    return async (e: EventFired<OnAnySdmGoalSet.Subscription>, ctx: HandlerContext) => {
        const optsToUse: QueueOptions = {
            ...DefaultQueueOptions,
            ...options,
        };

        const goalSets = await ctx.graphClient.query<InProcessSdmGoalSets.Query, InProcessSdmGoalSets.Variables>({
            name: "InProcessSdmGoalSets",
            variables: {
                fetch: optsToUse.fetch + optsToUse.concurrent,
                offset: 0,
                registration: [configuration.name],
            },
            options: QueryNoCacheOptions,
        });

        if (goalSets && goalSets.SdmGoalSet && goalSets.SdmGoalSet.length > 0) {
            await startGoals(goalSets, optsToUse, definition, ctx);
            // await updateGoals(goalSets, optsToUse, details, ctx);
        }

        return Success;
    };
}

async function loadQueueGoals(goalsSets: SdmGoalSet[],
                              definition: GoalDefinition,
                              ctx: HandlerContext): Promise<SdmGoalFields.Fragment[]> {
    return (await ctx.graphClient.query<SdmGoalsByGoalSetIdAndUniqueName.Query, SdmGoalsByGoalSetIdAndUniqueName.Variables>({
        name: "SdmGoalsByGoalSetIdAndUniqueName",
        variables: {
            goalSetId: goalsSets.map(gs => gs.goalSetId),
            uniqueName: [definition.uniqueName],
        },
        options: QueryNoCacheOptions,
    })).SdmGoal as SdmGoalFields.Fragment[] || [];
}

async function startGoals(goalSets: InProcessSdmGoalSets.Query,
                          options: QueueOptions,
                          definition: GoalDefinition,
                          ctx: HandlerContext): Promise<void> {
    // Update goal sets that are allowed to start
    const goalSetsToStart = goalSets.SdmGoalSet.slice(0, options.concurrent)
        .filter(gs => gs.goals.some(g => g.uniqueName === definition.uniqueName));
    if (goalSetsToStart.length > 0) {

        logger.debug(`Following goal sets are ready to start: '${goalSetsToStart.map(gs => gs.goalSetId).join(", ")}'`);
        const queueGoals = await loadQueueGoals(goalSetsToStart, definition, ctx);

        for (const goalSetToStart of goalSetsToStart) {
            const queueGoal = _.maxBy(queueGoals.filter(g => g.goalSetId === goalSetToStart.goalSetId), "ts") as SdmGoalEvent;
            logger.debug(`Updating goal '${definition.uniqueName}' of goal set '${queueGoal.goalSetId}' to 'success'`);
            if (queueGoal.state === SdmGoalState.in_process) {
                await updateGoal(ctx, queueGoal, {
                    state: SdmGoalState.success,
                    description: definition.completedDescription,
                });
            }
        }
    }
}
