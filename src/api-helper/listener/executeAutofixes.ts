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
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { combineEditResults } from "@atomist/automation-client/operations/edit/projectEditorOps";
import * as _ from "lodash";
import { sprintf } from "sprintf-js";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { AutofixRegistration } from "../../api/registration/AutofixRegistration";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { confirmEditedness } from "../command/transform/confirmEditedness";
import { toScalarProjectEditor } from "../machine/handlerRegistrations";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute autofixes against this push
 * Throw an error on failure
 * @param projectLoader use to load projects
 * @param {AutofixRegistration[]} registrations
 * @param repoRefResolver RepoRefResolver
 * @return GoalExecutor
 */
export function executeAutofixes(projectLoader: ProjectLoader,
                                 registrations: AutofixRegistration[],
                                 repoRefResolver: RepoRefResolver): ExecuteGoal {
    return async (goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { sdmGoal, credentials, context, progressLog } = goalInvocation;
        progressLog.write(sprintf("Executing %d autofixes", registrations.length));
        try {
            if (registrations.length === 0) {
                return Success;
            }
            const push = sdmGoal.push;
            const editableRepoRef = repoRefResolver.toRemoteRepoRef(sdmGoal.push.repo, { branch: push.branch });
            const editResult = await projectLoader.doWithProject<EditResult>({
                    credentials,
                    id: editableRepoRef,
                    context,
                    readOnly: false,
                },
                async project => {
                    const cri: PushImpactListenerInvocation = await createPushImpactListenerInvocation(goalInvocation, project);
                    const relevantAutofixes: AutofixRegistration[] =
                        filterImmediateAutofixes(await relevantCodeActions(registrations, cri), goalInvocation);
                    progressLog.write(sprintf("Will apply %d relevant autofixes of %d to %j: [%s] of [%s]",
                        relevantAutofixes.length, registrations.length, cri.id,
                        relevantAutofixes.map(a => a.name).join(),
                        registrations.map(a => a.name).join()));
                    let cumulativeResult: EditResult = {
                        target: cri.project,
                        success: true,
                        edited: false,
                    };
                    for (const autofix of _.flatten(relevantAutofixes)) {
                        const thisEdit = await runOne(cri, autofix, progressLog);
                        cumulativeResult = combineEditResults(cumulativeResult, thisEdit);
                    }
                    if (cumulativeResult.edited) {
                        await cri.project.push();
                    }
                    return cumulativeResult;
                });
            if (editResult.edited) {
                // Send back an error code, because we want to stop execution of goals after this
                return { code: 1, message: "Edited" };
            }
            return Success;
        } catch (err) {
            logger.warn("Autofixes failed with %s: Ignoring failure.\n%s", err.message, err.stack);
            progressLog.write(sprintf("Autofixes failed with %s: Ignoring failure", err.message));
            return Success;
        }
    };
}

async function runOne(cri: PushImpactListenerInvocation,
                      autofix: AutofixRegistration,
                      progressLog: ProgressLog): Promise<EditResult> {
    const project = cri.project;
    progressLog.write(sprintf("About to edit %s with autofix %s", (project.id as RemoteRepoRef).url, autofix.name));
    try {
        const tentativeEditResult = await toScalarProjectEditor(autofix.transform)(
            project,
            cri.context,
            autofix.parametersInstance);
        const editResult = await confirmEditedness(tentativeEditResult);

        if (!editResult.success) {
            await project.revert();
            logger.warn("Edited %s with autofix %s and success=false, edited=%d",
                (project.id as RemoteRepoRef).url, autofix.name, editResult.edited);
            progressLog.write(sprintf("Edited %s with autofix %s and success=false, edited=%d",
                (project.id as RemoteRepoRef).url, autofix.name, editResult.edited));
            if (!!autofix.options && autofix.options.ignoreFailure) {
                // Say we didn't edit and can keep going
                return { target: project, edited: false, success: false };
            }
        } else if (editResult.edited) {
            await project.commit(generateCommitMessageForAutofix(autofix));
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
        progressLog.write(sprintf("Ignoring editor failure %s on %s with autofix %s",
            err.message, (project.id as RemoteRepoRef).url, autofix.name));
        return { target: project, success: false, edited: false };
    }
}

/**
 * Filter any provided autofixes whose results were included in the commits of the current push.
 * @param {AutofixRegistration[]} autofixes
 * @param {GoalInvocation} gi
 * @returns {AutofixRegistration[]}
 */
export function filterImmediateAutofixes(autofixes: AutofixRegistration[],
                                         gi: GoalInvocation): AutofixRegistration[] {
    return autofixes.filter(
        af => !(gi.sdmGoal.push.commits || [])
            .some(c => c.message === generateCommitMessageForAutofix(af)));
}

/**
 * Generate a commit message for the provided autofix.
 * @param {AutofixRegistration} autofix
 * @returns {string}
 */
export function generateCommitMessageForAutofix(autofix: AutofixRegistration): string {
    return `Autofix: ${autofix.name}\n\n[atomist:generated] [atomist:autofix=${autofix.name}]`;
}
