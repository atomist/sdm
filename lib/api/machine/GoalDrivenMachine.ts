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

import { SdmContext } from "../context/SdmContext";
import { GoalContribution } from "../dsl/goalContribution";
import { Goals } from "../goal/Goals";
import { GoalImplementationMapper } from "../goal/support/GoalImplementationMapper";
import { PushListenerInvocation } from "../listener/PushListener";
import { GoalSetter } from "../mapping/GoalSetter";
import { PushMapping } from "../mapping/PushMapping";
import { GoalApprovalRequestVoter } from "../registration/GoalApprovalRequestVoter";
import { MachineConfiguration } from "./MachineConfiguration";
import { SoftwareDeliveryMachineConfiguration } from "./SoftwareDeliveryMachineOptions";

/**
 * Interface for machines driven by configurable goals.
 * Goals and goal "implementations" can be defined by users.
 */
export interface GoalDrivenMachine<O extends SoftwareDeliveryMachineConfiguration> extends MachineConfiguration<O> {

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    pushMapping: PushMapping<Goals>;

    readonly goalFulfillmentMapper: GoalImplementationMapper;

    /**
     * Add goal setting contributions that will be added into SDM goal setting.
     * Decorates other goal setting behavior.
     *
     * For example, always do fingerprints:
     *   sdm.addGoalContributions(onAnyPush().setGoals(FingerprintGoal))
     *
     * Or, sometimes do a custom local deploy goal:
     *   sdm.addGoalContributions(
     *       whenPushSatisfies(IsSdm, IsInLocalMode).setGoals(
     *          new Goals("delivery", LocalSdmDelivery)));
     * @param goalContributions contributions to goals
     */
    addGoalContributions(goalContributions: GoalSetter): this;

    /**
     * Add goal setting contributions that will be added into the SDM goal setting via an
     * additive goal setter.
     * @param contributor contributor to set
     * @param contributors contributors to set with contributor
     */
    withPushRules<F extends SdmContext = PushListenerInvocation>(contributor: GoalContribution<F>,
                                                                 ...contributors: Array<GoalContribution<F>>): this;

    /**
     * Add vote that gets to decide whether to deny or grant goal approval requests.
     * @param vote
     */
    addGoalApprovalRequestVoter(vote: GoalApprovalRequestVoter): this;

}
