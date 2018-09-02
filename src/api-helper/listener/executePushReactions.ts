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
    logger,
    Success,
} from "@atomist/automation-client";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import {
    PushImpactListenerRegisterable,
    PushImpactListenerRegistration,
    PushReactionResponse,
    toPushReactionRegistration,
} from "../../api/registration/PushImpactListenerRegistration";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute arbitrary code reactions against a codebase
 * @param {ProjectLoader} projectLoader
 * @param {PushImpactListenerRegistration[]} registrations
 * @return {ExecuteGoal}
 */
export function executePushReactions(registrations: PushImpactListenerRegisterable[]): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        if (registrations.length === 0) {
            return Success;
        }

        const { sdm, credentials, id, context } = goalInvocation;
        return sdm.configuration.sdm.projectLoader.doWithProject({ credentials, id, context, readOnly: true }, async project => {
            const cri: PushImpactListenerInvocation = await createPushImpactListenerInvocation(goalInvocation, project);
            const regs = registrations.map(toPushReactionRegistration);
            const relevantCodeReactions: PushImpactListenerRegistration[] = await relevantCodeActions<PushImpactListenerRegistration>(regs, cri);
            logger.info("Will invoke %d eligible code reactions of %d to %j: [%s] of [%s]",
                relevantCodeReactions.length, registrations.length, cri.id,
                relevantCodeReactions.map(a => a.name).join(),
                regs.map(a => a.name).join());
            const allReactions: any[] = await Promise.all(relevantCodeReactions
                .map(reactionReg => reactionReg.action(cri)));
            const result = {
                code: allReactions.includes(PushReactionResponse.failGoals) ? 1 : 0,
                requireApproval: allReactions.includes(PushReactionResponse.requireApprovalToProceed),
            };
            logger.info("Code reaction responses are %j, result=%j", allReactions, result);
            return result;
        });
    };
}
