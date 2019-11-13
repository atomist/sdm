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
    Configuration,
    ConfigurationAware,
    guid,
    HandlerContext,
    logger,
    ProjectOperationCredentials,
    RemoteRepoRef,
} from "@atomist/automation-client";
import * as _ from "lodash";
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
import { StatefulPushListenerInvocation } from "../../api/dsl/goalContribution";
import { EnrichGoal } from "../../api/goal/enrichGoal";
import {
    Goal,
    GoalDefinition,
    GoalWithPrecondition,
    hasPreconditions,
} from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import {
    getGoalDefinitionFrom,
    PlannedGoal,
} from "../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
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
    GoalSetTag,
    TagGoalSet,
} from "../../api/goal/tagGoalSet";
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

    enrichGoal?: EnrichGoal;

    tagGoalSet?: TagGoalSet;

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
    const enrichGoal = !!rules.enrichGoal ? rules.enrichGoal : async g => g;
    const tagGoalSet = !!rules.tagGoalSet ? rules.tagGoalSet : async () => [];
    const id = repoRefResolver.repoRefFromPush(push);
    const addressChannels = addressChannelsFor(push.repo, context);
    const preferences = !!preferencesFactory ? preferencesFactory(parameters.context) : NoPreferenceStore;
    const configuration = (context as any as ConfigurationAware).configuration;
    const goalSetId = guid();

    const { determinedGoals, goalsToSave, tags } = await determineGoals(
        { projectLoader, repoRefResolver, goalSetter, implementationMapping, enrichGoal, tagGoalSet }, {
            credentials, id, context, push, addressChannels, preferences, goalSetId, configuration,
        });

    if (goalsToSave.length > 0) {
        // First store the goals
        await Promise.all(goalsToSave.map(g => storeGoal(context, g, push)));

        // And then store the goalSet
        await storeGoalSet(context, goalSetId, determinedGoals.name, goalsToSave, tags, push);
    }

    // Let GoalSetListeners know even if we determined no goals.
    // This is not an error
    const gsi: GoalsSetListenerInvocation = {
        id,
        context,
        credentials,
        addressChannels,
        configuration,
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
                                         enrichGoal: EnrichGoal,
                                         tagGoalSet?: TagGoalSet,
                                     },
                                     circumstances: {
                                         credentials: ProjectOperationCredentials,
                                         id: RemoteRepoRef,
                                         context: HandlerContext,
                                         configuration: Configuration,
                                         push: PushFields.Fragment,
                                         addressChannels: AddressChannels,
                                         preferences?: PreferenceStore,
                                         goalSetId: string,
                                     }): Promise<{
    determinedGoals: Goals | undefined,
    goalsToSave: SdmGoalMessage[],
    tags: GoalSetTag[],
}> {
    const { enrichGoal, projectLoader, repoRefResolver, goalSetter, implementationMapping, tagGoalSet } = rules;
    const { credentials, id, context, push, addressChannels, goalSetId, preferences, configuration } = circumstances;
    return projectLoader.doWithProject({
            credentials,
            id,
            context,
            readOnly: true,
            cloneOptions: minimalClone(push, { detachHead: true }),
        },
        async project => {
            const pli: StatefulPushListenerInvocation = {
                project,
                credentials,
                id,
                push,
                context,
                addressChannels,
                configuration,
                preferences: preferences || NoPreferenceStore,
                facts: {},
            };
            const determinedGoals = await chooseGoalsForPushOnProject({ goalSetter }, pli);
            if (!determinedGoals) {
                return { determinedGoals: undefined, goalsToSave: [], tags: [] };
            }
            const goalsToSave = await sdmGoalsFromGoals(
                implementationMapping,
                push,
                repoRefResolver,
                pli,
                determinedGoals,
                goalSetId);

            // Enrich all goals before they get saved
            await Promise.all(goalsToSave.map(async g1 => enrichGoal(g1, pli)));

            // Optain tags for the goal set
            let tags: GoalSetTag[] = [];
            if (!!tagGoalSet) {
                tags = (await tagGoalSet(goalsToSave, pli)) || [];
            }

            return { determinedGoals, goalsToSave, tags };
        });

}

async function sdmGoalsFromGoals(implementationMapping: GoalImplementationMapper,
                                 push: PushFields.Fragment,
                                 repoRefResolver: RepoRefResolver,
                                 pli: PushListenerInvocation,
                                 determinedGoals: Goals,
                                 goalSetId: string): Promise<SdmGoalMessage[]> {
    return Promise.all(determinedGoals.goals.map(async g => {
        const ge = constructSdmGoal(pli.context, {
            goalSet: determinedGoals.name,
            goalSetId,
            goal: g,
            state: (hasPreconditions(g) ? SdmGoalState.planned :
                (g.definition.preApprovalRequired ? SdmGoalState.waiting_for_pre_approval : SdmGoalState.requested)) as SdmGoalState,
            id: pli.id,
            providerId: repoRefResolver.providerIdFromPush(pli.push),
            fulfillment: await fulfillment({ implementationMapping }, g, pli),
        });

        if (ge.state === SdmGoalState.requested) {

            const cbs = implementationMapping.findFulfillmentCallbackForGoal({ ...ge, push }) || [];
            let ng: SdmGoalEvent = { ...ge, push };
            for (const cb of cbs) {
                ng = await cb.callback(ng, pli);
            }

            return {
                ...ge,
                data: ng.data,
            };
        } else {
            return ge;
        }
    }));
}

async function fulfillment(rules: {
                               implementationMapping: GoalImplementationMapper,
                           },
                           g: Goal,
                           inv: PushListenerInvocation): Promise<SdmGoalFulfillment> {
    const { implementationMapping } = rules;
    const plan = await implementationMapping.findFulfillmentByPush(g, inv);
    if (isGoalImplementation(plan)) {
        return constructSdmGoalImplementation(plan, inv.configuration.name);
    } else if (isGoalSideEffect(plan)) {
        return { method: SdmGoalFulfillmentMethod.SideEffect, name: plan.sideEffectName, registration: plan.registration };
    } else {
        return { method: SdmGoalFulfillmentMethod.Other, name: "unknown", registration: "unknown" };
    }
}

async function chooseGoalsForPushOnProject(rules: { goalSetter: GoalSetter },
                                           pi: PushListenerInvocation): Promise<Goals> {
    const { goalSetter } = rules;
    const { push, id } = pi;

    try {
        const determinedGoals: Goals = await goalSetter.mapping(pi);

        if (!determinedGoals) {
            logger.info("No goals set by push '%s' to '%s/%s/%s'", push.after.sha, id.owner, id.repo, push.branch);
            return determinedGoals;
        } else {
            const filteredGoals: Goal[] = [];
            const plannedGoals = await planGoals(determinedGoals, pi);
            plannedGoals.goals.forEach(g => {
                if ((g as any).dependsOn) {
                    const preConditions = (g as any).dependsOn as Goal[];
                    if (preConditions) {
                        const filteredPreConditions = preConditions.filter(pc => plannedGoals.goals.some(ag =>
                            ag.uniqueName === pc.uniqueName &&
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
            logger.info("Goals for push '%s' on '%s/%s/%s' are '%s'", push.after.sha, id.owner, id.repo, push.branch, plannedGoals.name);
            return new Goals(plannedGoals.name, ...filteredGoals);
        }

    } catch (err) {
        logger.error("Error determining goals: %s", err);
        logger.error(err.stack);
        throw err;
    }
}

export async function planGoals(goals: Goals, pli: PushListenerInvocation): Promise<Goals> {
    const allGoals = [...goals.goals];
    const names = [];

    for (const dg of goals.goals) {
        if (!!(dg as any).plan) {
            let planResult = await (dg as any).plan(pli, goals);
            if (!!planResult) {

                // Check if planResult is a PlannedGoal or PlannedGoals instance
                if (!_.some(planResult, v => !!v.goals)) {
                     planResult = { "#": { goals: planResult } };
                }

                const allNewGoals = [];
                const goalMapping = new Map<string, Goal[]>();
                _.forEach(planResult, (planResultGoals, n) => {
                    names.push(n.replace(/_/g, " "));
                    const plannedGoals: Array<PlannedGoal | PlannedGoal[]> = [];
                    if (Array.isArray(planResultGoals.goals)) {
                        plannedGoals.push(...planResultGoals.goals);
                    } else {
                        plannedGoals.push(planResultGoals.goals);
                    }

                    let previousGoals = [];
                    const newGoals = [];
                    plannedGoals.forEach(g => {
                        if (Array.isArray(g)) {
                            const gNewGoals = [];
                            for (const gg of g) {
                                const newGoal = createGoal(
                                    gg,
                                    dg,
                                    planResultGoals.dependsOn,
                                    allNewGoals.length + gNewGoals.length,
                                    previousGoals,
                                    goalMapping);
                                gNewGoals.push(newGoal);
                            }
                            allNewGoals.push(...gNewGoals);
                            newGoals.push(...gNewGoals);
                            previousGoals = [...gNewGoals];
                        } else {
                            const newGoal = createGoal(
                                g,
                                dg,
                                planResultGoals.dependsOn,
                                allNewGoals.length,
                                previousGoals,
                                goalMapping);
                            allNewGoals.push(newGoal);
                            newGoals.push(newGoal);
                            previousGoals = [newGoal];
                        }
                    });

                    goalMapping.set(n, newGoals);
                });

                // Replace existing goal with new instances
                const ix = allGoals.findIndex(g => g.uniqueName === dg.uniqueName);
                allGoals.splice(ix, 1, ...allNewGoals);

                // Replace all preConditions that point back to the original goal with references to new goals
                allGoals.filter(hasPreconditions)
                    .filter(g => (g.dependsOn || []).includes(dg))
                    .forEach(g => {
                        _.remove(g.dependsOn, gr => gr.uniqueName === dg.uniqueName);
                        g.dependsOn.push(...allNewGoals);
                    });
            }
        }
    }

    return new Goals(goals.name, ...allGoals);
}

function createGoal(g: PlannedGoal,
                    dg: Goal,
                    preConditions: string | string[],
                    plannedGoalsCounter: number,
                    previousGoals: Goal[],
                    goalMapping: Map<string, Goal[]>): Goal {
    const uniqueName = `${dg.uniqueName}#sdm:${plannedGoalsCounter}`;

    const definition: GoalDefinition & { parameters: PlannedGoal["parameters"] } =
        _.merge(
            {},
            dg.definition,
            getGoalDefinitionFrom(g.details, uniqueName)) as any;

    definition.uniqueName = uniqueName;
    definition.parameters = g.parameters;

    const dependsOn = [];
    if (hasPreconditions(dg)) {
        dependsOn.push(...dg.dependsOn);
    }
    if (!!previousGoals) {
        dependsOn.push(...previousGoals);
    }
    if (!!preConditions) {
        if (Array.isArray(preConditions)) {
            dependsOn.push(..._.flatten(preConditions.map(d => goalMapping.get(d)).filter(d => !!d)));
        } else {
            dependsOn.push(...goalMapping.get(preConditions));
        }
    }
    return new GoalWithPrecondition(definition, ..._.uniqBy(dependsOn.filter(d => !!d), "uniqueName"));
}
