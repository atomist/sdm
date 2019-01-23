/*
 * Copyright © 2019 Atomist, Inc.
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
    guid,
    HandlerContext,
    logger,
    ProjectOperationCredentials,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    AddressChannels,
    addressChannelsFor,
} from "../../api/context/addressChannels";
import { ParameterPromptFactory } from "../../api/context/parameterPrompt";
import {
    NoPreferenceStore,
    PreferenceStore,
    PreferenceStoreFactory,
} from "../../api/context/preferenceStore";
import {
    Goal,
    GoalWithPrecondition,
    hasPreconditions,
} from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import {
    SdmGoalFulfillment,
    SdmGoalFulfillmentMethod,
    SdmGoalMessage,
} from "../../api/goal/SdmGoalMessage";
import {
    GoalImplementationMapper,
    isGoalImplementation,
    isGoalSideEffect,
} from "../../api/goal/support/GoalImplementationMapper";
import {
    GoalsSetListener,
    GoalsSetListenerInvocation,
} from "../../api/listener/GoalsSetListener";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import {
    PushFields,
    SdmGoalState,
} from "../../typings/types";
import { minimalClone } from "./minimalClone";
import {
    constructSdmGoal,
    constructSdmGoalImplementation,
    storeGoal,
    storeGoalSet,
} from "./storeGoals";

/**
 * Configuration for handling incoming pushes
 */
export interface ChooseAndSetGoalsRules {

    projectLoader: ProjectLoader;

    repoRefResolver: RepoRefResolver;

    goalsListeners: GoalsSetListener[];

    goalSetter: GoalSetter;

    implementationMapping: GoalImplementationMapper;

    enrichGoal?: (goal: SdmGoalMessage) => Promise<SdmGoalMessage>;

    preferencesFactory?: PreferenceStoreFactory;

    parameterPromptFactory?: ParameterPromptFactory<any>;
}

/**
 * Choose and set goals for this push
 * @param {ChooseAndSetGoalsRules} rules: configuration for handling incoming pushes
 * @param parameters details of incoming request
 * @return {Promise<Goals | undefined>}
 */
export async function chooseAndSetGoals(rules: ChooseAndSetGoalsRules,
                                        parameters: {
                                            context: HandlerContext,
                                            credentials: ProjectOperationCredentials,
                                            push: PushFields.Fragment,
                                        }): Promise<Goals | undefined> {
    const { projectLoader, goalsListeners, goalSetter, implementationMapping, repoRefResolver, preferencesFactory } = rules;
    const { context, credentials, push } = parameters;
    const enrichGoal = rules.enrichGoal ? rules.enrichGoal : async g => g;
    const id = repoRefResolver.repoRefFromPush(push);
    const addressChannels = addressChannelsFor(push.repo, context);
    const preferences = !!preferencesFactory ? preferencesFactory(parameters.context) : NoPreferenceStore;
    const goalSetId = guid();

    const { determinedGoals, goalsToSave } = await determineGoals(
        { projectLoader, repoRefResolver, goalSetter, implementationMapping }, {
            credentials, id, context, push, addressChannels, preferences, goalSetId,
        });

    if (goalsToSave.length > 0) {
        // Store all the goals first
        await Promise.all(goalsToSave.map(async g1 => {
            return enrichGoal(g1).then(g2 => storeGoal(context, g2, push));
        }));

        // And then store the goalSetId
        await storeGoalSet(context, goalSetId, determinedGoals.name, goalsToSave, push);
    }

    // Let GoalSetListeners know even if we determined no goals.
    // This is not an error
    const gsi: GoalsSetListenerInvocation = {
        id,
        context,
        credentials,
        addressChannels,
        preferences,
        goalSetId,
        goalSetName: determinedGoals ? determinedGoals.name : undefined,
        goalSet: determinedGoals,
        push,
    };
    await Promise.all(goalsListeners.map(l => l(gsi)));
    return determinedGoals;
}

export async function determineGoals(rules: {
                                         projectLoader: ProjectLoader,
                                         repoRefResolver: RepoRefResolver,
                                         goalSetter: GoalSetter,
                                         implementationMapping: GoalImplementationMapper,
                                     },
                                     circumstances: {
                                         credentials: ProjectOperationCredentials,
                                         id: RemoteRepoRef,
                                         context: HandlerContext,
                                         push: PushFields.Fragment,
                                         addressChannels: AddressChannels,
                                         preferences?: PreferenceStore,
                                         goalSetId: string,
                                     }): Promise<{
    determinedGoals: Goals | undefined,
    goalsToSave: SdmGoalMessage[],
}> {
    const { projectLoader, repoRefResolver, goalSetter, implementationMapping } = rules;
    const { credentials, id, context, push, addressChannels, goalSetId, preferences } = circumstances;
    return projectLoader.doWithProject({
            credentials,
            id,
            context,
            readOnly: true,
            cloneOptions: minimalClone(push, { detachHead: true }),
        },
        async project => {
            const pli: PushListenerInvocation = {
                project,
                credentials,
                id,
                push,
                context,
                addressChannels,
                preferences: preferences || NoPreferenceStore,
            };
            const determinedGoals = await chooseGoalsForPushOnProject({ goalSetter }, pli);
            if (!determinedGoals) {
                return { determinedGoals: undefined, goalsToSave: [] };
            }
            const goalsToSave = await sdmGoalsFromGoals(implementationMapping, repoRefResolver, pli, determinedGoals, goalSetId);
            return { determinedGoals, goalsToSave };
        });

}

async function sdmGoalsFromGoals(implementationMapping: GoalImplementationMapper,
                                 repoRefResolver: RepoRefResolver,
                                 pli: PushListenerInvocation,
                                 determinedGoals: Goals,
                                 goalSetId: string) {
    return Promise.all(determinedGoals.goals.map(async g =>
        constructSdmGoal(pli.context, {
            goalSet: determinedGoals.name,
            goalSetId,
            goal: g,
            state: (hasPreconditions(g) ? SdmGoalState.planned :
                (g.definition.preApprovalRequired ? SdmGoalState.waiting_for_pre_approval : SdmGoalState.requested)) as SdmGoalState,
            id: pli.id,
            providerId: repoRefResolver.providerIdFromPush(pli.push),
            fulfillment: await fulfillment({ implementationMapping }, g, pli),
        })));
}

async function fulfillment(rules: {
                               implementationMapping: GoalImplementationMapper,
                           },
                           g: Goal,
                           inv: PushListenerInvocation): Promise<SdmGoalFulfillment> {
    const { implementationMapping } = rules;
    const plan = await implementationMapping.findFulfillmentByPush(g, inv);
    if (isGoalImplementation(plan)) {
        return constructSdmGoalImplementation(plan);
    } else if (isGoalSideEffect(plan)) {
        return { method: SdmGoalFulfillmentMethod.SideEffect, name: plan.sideEffectName };
    } else {
        return { method: SdmGoalFulfillmentMethod.Other, name: "unknown" };
    }
}

async function chooseGoalsForPushOnProject(rules: { goalSetter: GoalSetter },
                                           pi: PushListenerInvocation): Promise<Goals> {
    const { goalSetter } = rules;
    const { push, id, addressChannels } = pi;

    try {
        const determinedGoals: Goals = await goalSetter.mapping(pi);

        if (!determinedGoals) {
            logger.info("No goals set by push to %s:%s on %s", id.owner, id.repo, push.branch);
            return determinedGoals;
        } else {
            const filteredGoals: Goal[] = [];
            determinedGoals.goals.forEach(g => {
                if ((g as any).dependsOn) {
                    const preConditions = (g as any).dependsOn as Goal[];
                    if (preConditions) {
                        const filteredPreConditions = preConditions.filter(pc => determinedGoals.goals.some(ag =>
                            ag.name === pc.name &&
                            ag.environment === pc.environment));
                        if (filteredPreConditions.length > 0) {
                            filteredGoals.push(new GoalWithPrecondition(g.definition, ...filteredPreConditions));
                        } else {
                            filteredGoals.push(new Goal(g.definition));
                        }
                    } else {
                        filteredGoals.push(g);
                    }
                } else {
                    filteredGoals.push(g);
                }
            });
            logger.info("Goals for push on %j are %s", id, determinedGoals.name);
            return new Goals(determinedGoals.name, ...filteredGoals);
        }

    } catch (err) {
        logger.error("Error determining goals: %s", err);
        logger.error(err.stack);
        await addressChannels(`Serious error trying to determine goals. Please check SDM logs: ${err}`);
        throw err;
    }
}
