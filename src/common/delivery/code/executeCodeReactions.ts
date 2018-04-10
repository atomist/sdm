/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger, Success } from "@atomist/automation-client";
import { CodeReactionInvocation } from "../../listener/CodeReactionListener";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { ExecuteGoalWithLog, RunWithLogContext } from "../goals/support/reportGoalError";
import { CodeActionRegistration, relevantCodeActions } from "./CodeActionRegistration";
import { createCodeReactionInvocation } from "./createCodeReactionInvocation";

export function executeCodeReactions(projectLoader: ProjectLoader,
                                     registrations: CodeActionRegistration[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        if (registrations.length === 0) {
            return Success;
        }

        const {credentials, id, context} = rwlc;
        await projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
            const cri: CodeReactionInvocation = await createCodeReactionInvocation(rwlc, project);
            const relevantCodeReactions: CodeActionRegistration[] = await relevantCodeActions<CodeActionRegistration>(registrations, cri);
            logger.info("Will invoke %d eligible code reactions of %d to %j",
                relevantCodeReactions.length, registrations.length, cri.id);
            const allReactions: Promise<any> =
                Promise.all(relevantCodeReactions
                    .map(reactionReg => reactionReg.action(cri)));
            await allReactions;
        });
        return Success;
    };
}
