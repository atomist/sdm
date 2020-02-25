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

import * as _ from "lodash";
import { minimalClone } from "../../../../api-helper/goal/minimalClone";
import { goalData } from "../../../../api-helper/goal/sdmGoal";
import { descriptionFromState } from "../../../../api-helper/goal/storeGoals";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import { GoalInvocation } from "../../../../api/goal/GoalInvocation";
import { SdmGoalFulfillmentMethod } from "../../../../api/goal/SdmGoalMessage";
import { GoalScheduler } from "../../../../api/goal/support/GoalScheduler";
import { SdmGoalState } from "../../../../typings/types";
import {
    Container,
    ContainerRegistration,
    ContainerRegistrationGoalDataKey,
} from "../../../goal/container/container";

export interface KubernetesFulfillmentOptions {
    registration?: string | ((gi: GoalInvocation) => Promise<string>);
    name?: string | ((gi: GoalInvocation) => Promise<string>);
}

export function defaultKubernetesFulfillmentOptions(): KubernetesFulfillmentOptions {
    return {
        registration: "@atomist/k8s-sdm-skill",
        name: require("../../../goal/container/k8s").K8sContainerFulfillerName,
    };
}

/**
 * GoalScheduler implementation that redirects goals to a registered k8s-sdm for
 * fulfillment.
 *
 * This is useful in runtimes that don't support launching container goals such as
 * FaaS environments like Google Cloud Functions.
 */
export class KubernetesFulfillmentGoalScheduler implements GoalScheduler {

    constructor(private readonly options: KubernetesFulfillmentOptions = defaultKubernetesFulfillmentOptions()) {
    }

    public async schedule(gi: GoalInvocation): Promise<ExecuteGoalResult> {
        const { goalEvent, goal, configuration } = gi;
        const containerGoal = goal as Container;
        let registration: ContainerRegistration = _.cloneDeep(containerGoal.registrations[0]);

        const fulfillment = _.get(registration, "fulfillment");
        if (!!fulfillment) {
            goalEvent.fulfillment.registration = fulfillment.registration;
            goalEvent.fulfillment.name = fulfillment.name;
        } else {
            goalEvent.fulfillment.registration =
                typeof this.options.registration === "string" ? this.options.registration : await this.options.registration(gi);
            goalEvent.fulfillment.name =
                typeof this.options.name === "string" ? this.options.name : await this.options.name(gi);
        }
        goalEvent.fulfillment.method = SdmGoalFulfillmentMethod.Sdm;

        if (registration.callback) {
            registration = await configuration.sdm.projectLoader.doWithProject({
                ...gi,
                readOnly: true,
                cloneOptions: minimalClone(goalEvent.push, { detachHead: true }),
            }, async p => {
                return {
                    ...registration,
                    ...(await registration.callback(_.cloneDeep(registration), p, containerGoal, goalEvent, gi)) || {},
                };
            });
        }

        const data: any = goalData(goalEvent);
        const newData: any = {};
        delete registration.callback;
        _.set<any>(newData, ContainerRegistrationGoalDataKey, registration);

        goalEvent.data = JSON.stringify(_.merge(data, newData));

        return {
            state: SdmGoalState.requested,
            description: descriptionFromState(goal, SdmGoalState.requested),
            phase: "scheduled",
        };
    }

    public async supports(gi: GoalInvocation): Promise<boolean> {
        const { goal } = gi;
        return goal instanceof Container;
    }
}
