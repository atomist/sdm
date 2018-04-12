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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { combineEditResults } from "@atomist/automation-client/operations/edit/projectEditorOps";
import * as _ from "lodash";
import { confirmEditedness } from "../../../../util/git/confirmEditedness";
import { CodeReactionInvocation } from "../../../listener/CodeReactionListener";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { ExecuteGoalResult } from "../../goals/goalExecution";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../goals/support/reportGoalError";
import { relevantCodeActions } from "../CodeActionRegistration";
import { createCodeReactionInvocation } from "../createCodeReactionInvocation";
import { AutofixRegistration } from "./AutofixRegistration";

/**
 * Execute autofixes against this push
 * Throw an error on failure
 * @param projectLoader use to load projects
 * @param {AutofixRegistration[]} registrations
 * @return GoalExecutor
 */
export function executeAutofixes(projectLoader: ProjectLoader,
                                 registrations: AutofixRegistration[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const {credentials, context, status} = rwlc;
        logger.info("Executing %d autofixes", registrations.length);
        try {
            const commit = status.commit;
            if (registrations.length === 0) {
                return Success;
            }
            const push = commit.pushes[0];
            const editableRepoRef = new GitHubRepoRef(commit.repo.owner, commit.repo.name, push.branch);
            const editResult = await projectLoader.doWithProject<EditResult>({
                    credentials,
                    id: editableRepoRef,
                    context,
                    readOnly: false,
                },
                async project => {
                    const cri: CodeReactionInvocation = await createCodeReactionInvocation(rwlc, project);
                    const relevantAutofixes: AutofixRegistration[] = await relevantCodeActions(registrations, cri);
                    logger.info("Will apply %d eligible autofixes of %d to %j",
                        relevantAutofixes.length, registrations.length, cri.id);
                    let cumulativeResult: EditResult = {
                        target: cri.project,
                        success: true,
                        edited: false,
                    };
                    for (const autofix of _.flatten(relevantAutofixes)) {
                        const thisEdit = await runOne(cri, autofix);
                        cumulativeResult = combineEditResults(cumulativeResult, thisEdit);
                    }
                    if (cumulativeResult.edited) {
                        await cri.project.push();
                    }
                    return cumulativeResult;
                });
            if (editResult.edited) {
                // Send back an error code, because we want to stop execution of goals after this
                return {code: 1, message: "Edited"};
            }
            return Success;
        } catch (err) {
            logger.warn("Autofixes failed with %s: Ignoring failure", err.message);
            return Success;
        }
    };
}

async function runOne(cri: CodeReactionInvocation, autofix: AutofixRegistration): Promise<EditResult> {
    const project = cri.project;
    logger.info("About to edit %s with autofix %s", (project.id as RemoteRepoRef).url, autofix.name);
    try {
        const tentativeEditResult = await autofix.action(cri);
        const editResult = await confirmEditedness(tentativeEditResult);

        if (!editResult.success) {
            await project.revert();
            logger.warn("Edited %s with autofix %s and success=false, edited=%d",
                (project.id as RemoteRepoRef).url, autofix.name, editResult.edited);
            if (!!autofix.options && autofix.options.ignoreFailure) {
                // Say we didn't edit and can keep going
                return {target: project, edited: false, success: false};
            }
        } else if (editResult.edited) {
            await project.commit(`Autofix: ${autofix.name}\n\n[atomist:generated]`);
        } else {
            logger.debug("No changes were made by autofix %s", autofix.name);
        }
        return editResult;
    } catch (err) {
        if (!autofix.options || !autofix.options.ignoreFailure) {
            throw err;
        }
        await project.revert();
        logger.warn("Ignoring editor failure %s on %s with autofix %s",
            err.message, (project.id as RemoteRepoRef).url, autofix.name);
        return {target: project, success: false, edited: false};
    }
}
