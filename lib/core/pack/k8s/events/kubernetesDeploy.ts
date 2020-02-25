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
    Parameters,
    Value,
} from "@atomist/automation-client/lib/decorators";
import * as GraphQL from "@atomist/automation-client/lib/graph/graphQL";
import { EventFired } from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    HandlerResult,
    reduceResults,
} from "@atomist/automation-client/lib/HandlerResult";
import { OnEvent } from "@atomist/automation-client/lib/onEvent";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as stringify from "json-stringify-safe";
import {
    updateGoal,
    UpdateSdmGoalParams,
} from "../../../../api-helper/goal/storeGoals";
import { LoggingProgressLog } from "../../../../api-helper/log/LoggingProgressLog";
import { WriteToAllProgressLog } from "../../../../api-helper/log/WriteToAllProgressLog";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { SoftwareDeliveryMachineConfiguration } from "../../../../api/machine/SoftwareDeliveryMachineOptions";
import { EventHandlerRegistration } from "../../../../api/registration/EventHandlerRegistration";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import {
    KubernetesDeployRequestedSdmGoal,
    SdmGoalState,
} from "../../../../typings/types";
import { executeKubernetesDeployFulfill } from "../deploy/fulfiller";

/**
 * Parameters for the deploying an application to a Kubernetes cluster
 * via an event subscription.
 */
@Parameters()
export class KubernetesDeployParameters {
    /**
     * Make the entire SDM configuration available to this event
     * handler.  The specific properties used are:
     *
     * `name`: Name of this SDM.  Only requested SDM Kubernetes
     * deployment goals whose fulfillment name match this name are
     * deployed by this SDM.
     *
     * `sdm.logFactory`: Used to generate a log sink to send progress
     * logs to.
     */
    @Value("") // empty path returns the entire configuration
    public configuration: SoftwareDeliveryMachineConfiguration;
}

/**
 * Event handler for deploying an application to a Kubernetes cluster.
 * The definition of the application to be deployed is handled by the
 * [[KubernetesDeploy]] goal of this or another SDM.  This SDM will
 * execute deployments configured for it, see [[eligibleDeployGoal]]
 * and [[verifyKubernetesApplicationDeploy]] for details.
 */
export const HandleKubernetesDeploy: OnEvent<KubernetesDeployRequestedSdmGoal.Subscription, KubernetesDeployParameters> = async (
    ef: EventFired<KubernetesDeployRequestedSdmGoal.Subscription>,
    context: HandlerContext,
    params: KubernetesDeployParameters,
): Promise<HandlerResult> => {

    if (!ef || !ef.data || !ef.data.SdmGoal) {
        const message = "Received event had no SdmGoal";
        logger.warn(message);
        return { code: 0, message };
    }

    return Promise.all(ef.data.SdmGoal.map(async g => {
        const goalEvent = g as SdmGoalEvent;
        const progressLog = new WriteToAllProgressLog(goalEvent.name, new LoggingProgressLog(goalEvent.name, "debug"),
            await params.configuration.sdm.logFactory(context, goalEvent));
        try {
            const result = await executeKubernetesDeployFulfill({ context, goalEvent, progressLog });

            const updateParams: UpdateSdmGoalParams = {
                state: (result.code) ? SdmGoalState.failure : SdmGoalState.success,
                description: result.description,
                error: (result.code) ? new Error(result.message) : undefined,
                externalUrls: result.externalUrls,
            };
            try {
                await updateGoal(context, goalEvent, updateParams);
            } catch (e) {
                const msg = `Failed to update SDM goal ${goalEventString(goalEvent)} with params '${stringify(updateParams)}': ${e.message}`;
                progressLog.write(msg);
                result.message = `${e.message}; ${msg}`;
            }
            if (!result.code) {
                result.code = 0;
            }
            return result as ExecuteGoalResult & HandlerResult;
        } catch (e) {
            return failGoal(context, goalEvent, e.message, progressLog);
        }
    }))
        .then(reduceResults);
};

/**
 * Create an event handler registration for this SDM to deploy
 * requested Kubernetes applications.
 */
export function kubernetesDeployHandler(self: string)
    : EventHandlerRegistration<KubernetesDeployRequestedSdmGoal.Subscription, KubernetesDeployParameters> {
    return {
        name: "KubernetesDeploy",
        description: "Deploy application resources to Kubernetes cluster",
        tags: ["deploy", "kubernetes"],
        subscription: GraphQL.subscription({ name: "KubernetesDeployRequestedSdmGoal", variables: { fulfillmentName: self } }),
        paramsMaker: KubernetesDeployParameters,
        listener: HandleKubernetesDeploy,
    };
}

/**
 * Fail the provided goal using the message to set the description and
 * error message.
 *
 * @param context handler context to use to send the update
 * @param goalEvent SDM goal to update
 * @param message informative error message
 * @return a failure handler result using the provided error message
 */
async function failGoal(context: HandlerContext, goalEvent: SdmGoalEvent, message: string, log: ProgressLog): Promise<HandlerResult> {
    log.write(message);
    const params: UpdateSdmGoalParams = {
        state: SdmGoalState.failure,
        description: message,
        error: new Error(message),
    };
    try {
        await updateGoal(context, goalEvent, params);
    } catch (e) {
        const msg = `Failed to update SDM goal '${goalEventString(goalEvent)}' with params '${stringify(params)}': ${e.message}`;
        log.write(msg);
        return { code: 2, message: `${message}; ${msg}` };
    }
    return { code: 1, message };
}

/** Unique string for goal event. */
function goalEventString(goalEvent: SdmGoalEvent): string {
    return `${goalEvent.goalSetId}/${goalEvent.uniqueName}`;
}
