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

import {
    EventHandler,
    Value,
} from "@atomist/automation-client/lib/decorators";
import { automationClientInstance } from "@atomist/automation-client/lib/globals";
import { subscription } from "@atomist/automation-client/lib/graph/graphQL";
import {
    EventFired,
    HandleEvent,
} from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    HandlerResult,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { fetchGoalsFromPush } from "../../../../../api-helper/goal/fetchGoalsOnCommit";
import { preconditionsAreMet } from "../../../../../api-helper/goal/goalPreconditions";
import {
    goalKeyString,
    mapKeyToGoal,
} from "../../../../../api-helper/goal/sdmGoal";
import { updateGoal } from "../../../../../api-helper/goal/storeGoals";
import { resolveCredentialsPromise } from "../../../../../api-helper/machine/handlerRegistrations";
import { PreferenceStoreFactory } from "../../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../../api/context/skillContext";
import { SdmGoalEvent } from "../../../../../api/goal/SdmGoalEvent";
import {
    SdmGoalFulfillmentMethod,
    SdmGoalKey,
} from "../../../../../api/goal/SdmGoalMessage";
import { GoalImplementationMapper } from "../../../../../api/goal/support/GoalImplementationMapper";
import { SoftwareDeliveryMachineConfiguration } from "../../../../../api/machine/SoftwareDeliveryMachineOptions";
import { CredentialsResolver } from "../../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../../spi/repo-ref/RepoRefResolver";
import {
    OnAnySuccessfulSdmGoal,
    SdmGoalState,
} from "../../../../../typings/types";
import { shouldHandle } from "../../../../internal/delivery/goals/support/validateGoal";
import { verifyGoal } from "../../../../internal/signing/goalSigning";

/**
 * Move downstream goals from 'planned' to 'requested' when preconditions are met.
 */
@EventHandler("Move downstream goals from 'planned' to 'requested' when preconditions are met",
    () => subscription({
        name: "OnAnySuccessfulSdmGoal",
        variables: { registration: () => [automationClientInstance()?.configuration?.name] },
    }))
export class RequestDownstreamGoalsOnGoalSuccess implements HandleEvent<OnAnySuccessfulSdmGoal.Subscription> {

    @Value("")
    public configuration: SoftwareDeliveryMachineConfiguration;

    constructor(private readonly name: string,
                private readonly implementationMapper: GoalImplementationMapper,
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsResolver: CredentialsResolver,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {
    }

    public async handle(event: EventFired<OnAnySuccessfulSdmGoal.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const sdmGoal = event.data.SdmGoal[0] as SdmGoalEvent;

        if (!shouldHandle(sdmGoal)) {
            logger.debug(`Goal ${sdmGoal.uniqueName} skipped because not managed by this SDM`);
            return Success;
        }

        await verifyGoal(sdmGoal, this.configuration.sdm.goalSigning, context);

        const id = this.repoRefResolver.repoRefFromPush(sdmGoal.push);
        const credentials = await resolveCredentialsPromise(this.credentialsResolver.eventHandlerCredentials(context, id));
        const preferences = this.preferenceStoreFactory(context);

        const goals = fetchGoalsFromPush(sdmGoal);

        const goalsToRequest = goals.filter(g => isDirectlyDependentOn(sdmGoal, g))
            .filter(g => expectToBeFulfilledAfterRequest(g, this.name))
            .filter(shouldBePlannedOrSkipped)
            .filter(g => preconditionsAreMet(g, { goalsForCommit: goals }));

        if (goalsToRequest.length > 0) {
            logger.debug("because %s is successful, these goals are now ready: %s", goalKeyString(sdmGoal),
                goalsToRequest.map(goalKeyString).join(", "));
        }

        await Promise.all(goalsToRequest.map(async sdmG => {
            if (sdmG.preApprovalRequired) {
                return updateGoal(context, sdmG, {
                    state: SdmGoalState.waiting_for_pre_approval,
                    description: !!sdmGoal.descriptions && !!sdmGoal.descriptions.waitingForPreApproval
                        ? sdmGoal.descriptions.waitingForPreApproval : `Start required: ${sdmG.name}`,
                });
            } else {
                let g = sdmG;
                const cbs = this.implementationMapper.findFulfillmentCallbackForGoal(sdmG);
                for (const cb of cbs) {
                    g = await cb.callback(g,
                        {
                            id,
                            addressChannels: undefined,
                            preferences,
                            configuration: this.configuration,
                            credentials,
                            context,
                            skill: createSkillContext(context),
                        });
                }
                return updateGoal(context, g, {
                    state: SdmGoalState.requested,
                    description: !!sdmGoal.descriptions && !!sdmGoal.descriptions.requested
                        ? sdmGoal.descriptions.requested : `Ready: ${g.name}`,
                    data: g.data,
                });
            }
        }));
        return Success;
    }
}

function shouldBePlannedOrSkipped(dependentGoal: SdmGoalEvent): boolean {
    if (dependentGoal.state === SdmGoalState.planned) {
        return true;
    }
    if (dependentGoal.state === SdmGoalState.skipped) {
        logger.debug("Goal %s was skipped, but now maybe it can go", dependentGoal.uniqueName);
        return true;
    }
    if (dependentGoal.state === SdmGoalState.failure && dependentGoal.retryFeasible) {
        logger.debug("Goal %s failed, but maybe we will retry it", dependentGoal.uniqueName);
        return true;
    }
    logger.debug("Goal '%s' in state '%s' will not be requested", dependentGoal.uniqueName, dependentGoal.state);
    return false;
}

function expectToBeFulfilledAfterRequest(dependentGoal: SdmGoalEvent, name: string): boolean {
    switch (dependentGoal.fulfillment.method) {
        case SdmGoalFulfillmentMethod.Sdm:
            return true;
        case SdmGoalFulfillmentMethod.SideEffect:
            return dependentGoal.fulfillment.name !== name;
        case SdmGoalFulfillmentMethod.Other:
            // legacy behavior
            return true;
        default:
            return false;
    }
}

function isDirectlyDependentOn(successfulGoal: SdmGoalKey, goal: SdmGoalEvent): boolean {
    if (!goal) {
        return false;
    }
    if (!goal.preConditions || goal.preConditions.length === 0) {
        return false; // no preconditions? not dependent
    }
    if (mapKeyToGoal(goal.preConditions)(successfulGoal)) {
        logger.debug("%s depends on %s", goal.uniqueName, successfulGoal.uniqueName);
        return true; // the failed goal is one of my preconditions? dependent
    }
    return false;
}
