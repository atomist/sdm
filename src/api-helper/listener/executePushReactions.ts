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

import { logger, Success } from "@atomist/automation-client";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import {
    PushReactionRegisterable,
    PushReactionRegistration,
    PushReactionResponse,
    toPushReactionRegistration,
} from "../../api/registration/PushReactionRegistration";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute arbitrary code reactions against a codebase
 * @param {ProjectLoader} projectLoader
 * @param {PushReactionRegistration[]} registrations
 * @return {ExecuteGoalWithLog}
 */
export function executePushReactions(projectLoader: ProjectLoader,
                                     registrations: PushReactionRegisterable[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        if (registrations.length === 0) {
            return Success;
        }

        const {credentials, id, context} = rwlc;
        return projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
            const cri: PushImpactListenerInvocation = await createPushImpactListenerInvocation(rwlc, project);
            const regs = registrations.map(toPushReactionRegistration);
            const relevantCodeReactions: PushReactionRegistration[] = await relevantCodeActions<PushReactionRegistration>(regs, cri);
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
