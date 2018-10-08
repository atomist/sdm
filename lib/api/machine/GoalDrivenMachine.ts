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

import { Goals } from "../goal/Goals";
import { GoalImplementationMapper } from "../goal/support/GoalImplementationMapper";
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
     *          new Goals("delivery", LocalSdmDeliveryGoal)));
     *   sdm.addGoalImplementation("SDM CD", LocalSdmDeliveryGoal,
     *          executeLocalSdmDelivery(options)); // tell it how to execute that custom goal
     * @param goalContributions contributions to goals
     */
    addGoalContributions(goalContributions: GoalSetter): this;

    /**
     * Add vote that gets to decide whether to deny or grant goal approval requests.
     * @param vote
     */
    addGoalApprovalRequestVoter(vote: GoalApprovalRequestVoter): this;

}
