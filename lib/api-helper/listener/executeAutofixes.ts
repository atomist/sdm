/*
 * Copyright © 2019 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import {
    EditMode,
    isBranchCommit,
    isPullRequest,
} from "@atomist/automation-client/lib/operations/edit/editModes";
import { EditResult } from "@atomist/automation-client/lib/operations/edit/projectEditor";
import { combineEditResults } from "@atomist/automation-client/lib/operations/edit/projectEditorOps";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { codeLine } from "@atomist/slack-messages";
import * as _ from "lodash";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { ReportProgress } from "../../api/goal/progress/ReportProgress";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { AutofixRegistration } from "../../api/registration/AutofixRegistration";
import { TransformPresentation } from "../../api/registration/CodeTransformRegistration";
import { PushAwareParametersInvocation } from "../../api/registration/PushAwareParametersInvocation";
import { SdmGoalState } from "../../typings/types";
import { confirmEditedness } from "../command/transform/confirmEditedness";
import { minimalClone } from "../goal/minimalClone";
import {
    ProgressTest,
    testProgressReporter,
} from "../goal/progress/progress";
import { toScalarProjectEditor } from "../machine/handlerRegistrations";
import { spawnLog } from "../misc/child_process";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Parameters that includes the current GoalInvocation
 */
export interface GoalInvocationParameters {
    /** Current goal invocation the autofixes are running */
    goalInvocation: GoalInvocation;
}

/**
 * Execute autofixes against this push
 * Throw an error on failure
 * @param {AutofixRegistration[]} registrations
 * @return ExecuteGoal
 */
export function executeAutofixes(registrations: AutofixRegistration[],
                                 transformPresentation?: TransformPresentation<GoalInvocationParameters>,
                                 extractAuthor: ExtractAuthor = NoOpExtractAuthor): ExecuteGoal {
    return async (goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { id, configuration, goalEvent, credentials, context, progressLog } = goalInvocation;
        progressLog.write("Evaluating to %d configured autofixes", registrations.length);
        try {
            if (registrations.length === 0) {
                return Success;
            }

            const push = goalEvent.push;
            const appliedAutofixes: AutofixRegistration[] = [];
            let editMode;
            const editResult = await configuration.sdm.projectLoader.doWithProject<EditResult>({
                    credentials,
                    id,
                    context,
                    readOnly: false,
                    cloneOptions: minimalClone(push),
                },
                async project => {
                    if ((await project.gitStatus()).sha !== id.sha) {
                        return {
                            success: true,
                            edited: false,
                            target: project,
                            description: "Autofixes not executing",
                            phase: "new commit on branch",
                        };
                    }
                    const cri: PushImpactListenerInvocation = await createPushImpactListenerInvocation(goalInvocation, project);

                    if (!!transformPresentation) {
                        editMode = transformPresentation({
                            ...cri,
                            parameters: {
                                goalInvocation,
                            },
                        } as any, project);
                        if (isBranchCommit(editMode)) {
                            if (await project.hasBranch(editMode.branch)) {
                                await project.checkout(editMode.branch);
                            } else {
                                await project.createBranch(editMode.branch);
                            }
                        }
                    }

                    const relevantAutofixes: AutofixRegistration[] =
                        filterImmediateAutofixes(await relevantCodeActions(registrations, cri), goalInvocation);
                    progressLog.write("Applying %d relevant autofixes of %d to %s/%s: '%s' of configured '%s'",
                        relevantAutofixes.length,
                        registrations.length,
                        cri.id.owner,
                        cri.id.repo,
                        relevantAutofixes.map(a => a.name).join(", "),
                        registrations.map(a => a.name).join(", "));
                    let cumulativeResult: EditResult = {
                        target: cri.project,
                        success: true,
                        edited: false,
                    };

                    for (const autofix of _.flatten(relevantAutofixes)) {
                        const thisEdit = await runOne(goalInvocation, cri, autofix, extractAuthor);
                        if (thisEdit.edited) {
                            appliedAutofixes.push(autofix);
                        }
                        cumulativeResult = combineEditResults(cumulativeResult, thisEdit);
                    }
                    if (cumulativeResult.edited) {
                        await cri.project.push();

                        if (!!editMode && isPullRequest(editMode)) {
                            const targetBranch = editMode.targetBranch || goalEvent.branch;
                            let body = `${editMode.body}

Applied autofixes:
${appliedAutofixes.map(af => ` * ${codeLine(af.name)}`).join("\n")}

[atomist:generated] [atomist:autofix]`.trim();

                            if (editMode.autoMerge) {
                                body = `${body} ${editMode.autoMerge.mode} ${editMode.autoMerge.method ? editMode.autoMerge.method : ""}`.trim();
                            }
                            await cri.project.raisePullRequest(editMode.title, body, targetBranch);
                        }
                    }
                    return cumulativeResult;
                });
            if (editResult.edited) {
                // Send back a stop state to skip downstream goals
                return {
                    code: 0,
                    message: "Edited",
                    description: goalInvocation.goal.stoppedDescription,
                    state: isNewBranch(editMode, goalEvent.branch) ? SdmGoalState.success : SdmGoalState.stopped,
                    phase: detailMessage(appliedAutofixes),
                };
            }
            return {
                code: 0,
                description: (editResult as any).description,
            };
        } catch (err) {
            logger.warn("Autofixes failed with '%s':\n%s", err.message, err.stack);
            progressLog.write("Autofixes failed with '%s'", err.message);
            if (err.stdout) {
                progressLog.write(err.stdout);
            }
            if (err.stderr) {
                progressLog.write(err.stderr);
            }
            return {
                code: 1,
                message: err.message,
            };
        }
    };
}

/**
 * Check if this autofix is going to commit to a new branch
 */
function isNewBranch(editMode: EditMode, branch: string): boolean {
    if (!!editMode && isBranchCommit(editMode)) {
        return editMode.branch !== branch;
    }
    return false;
}

function detailMessage(appliedAutofixes: AutofixRegistration[]): string {
    // We show only two autofixes by name here as otherwise the message is going to get too long
    if (appliedAutofixes.length <= 2) {
        return `${appliedAutofixes.map(af => af.name).join(", ")}`;
    } else {
        return `${appliedAutofixes.length} autofixes`;
    }
}

async function runOne(gi: GoalInvocation,
                      cri: PushImpactListenerInvocation,
                      autofix: AutofixRegistration,
                      extractAuthor: ExtractAuthor): Promise<EditResult> {
    const { progressLog, configuration } = gi;
    const project = cri.project;
    progressLog.write("About to transform %s with autofix '%s'", (project.id as RemoteRepoRef).url, autofix.name);
    try {
        const arg2: HandlerContext & PushAwareParametersInvocation<any> = {
            ...cri.context,
            ...cri,
            push: cri,
            progressLog,
        } as any;
        const tentativeEditResult = await toScalarProjectEditor(autofix.transform, configuration.sdm)(
            project,
            arg2,
            autofix.parametersInstance);
        const editResult = await confirmEditedness(tentativeEditResult);

        if (!editResult.success) {
            await project.revert();
            logger.warn("Edited %s with autofix %s and success=false, edited=%d",
                (project.id as RemoteRepoRef).url, autofix.name, editResult.edited);
            progressLog.write("Edited %s with autofix %s and success=false, edited=%d",
                (project.id as RemoteRepoRef).url, autofix.name, editResult.edited);
            if (!!autofix.options && autofix.options.ignoreFailure) {
                // Say we didn't edit and can keep going
                return { target: project, edited: false, success: false };
            }
        } else if (editResult.edited) {
            progressLog.write("Autofix '%s' made changes", autofix.name);
            await project.commit(generateCommitMessageForAutofix(autofix));

            const author = await extractAuthor(gi);
            if (!!author && !!author.name && !!author.email) {
                await spawnLog(
                    "git",
                    ["commit", "--amend", `--author="${author.name} <${author.email}>"`, "--no-edit"],
                    {
                        cwd: project.baseDir,
                        log: progressLog,
                    });
            }
        } else {
            progressLog.write("Autofix '%s' made no changes", autofix.name);
            logger.debug("No changes were made by autofix %s", autofix.name);
        }
        return editResult;
    } catch (err) {
        if (!autofix.options || !autofix.options.ignoreFailure) {
            throw err;
        }
        await project.revert();
        logger.warn("Ignoring autofix failure %s on %s with autofix %s",
            err.message, (project.id as RemoteRepoRef).url, autofix.name);
        progressLog.write("Ignoring autofix failure %s on %s with autofix %s",
            err.message, (project.id as RemoteRepoRef).url, autofix.name);
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
        af => !(gi.goalEvent.push.commits || [])
            .some(c => c.message === generateCommitMessageForAutofix(af)));
}

/**
 * Generate a commit message for the provided autofix.
 * @param {AutofixRegistration} autofix
 * @returns {string}
 */
export function generateCommitMessageForAutofix(autofix: AutofixRegistration): string {
    const name = autofix.name.toLowerCase().replace(/ /g, "_");
    return `Autofix: ${autofix.name}\n\n[atomist:generated] [atomist:autofix=${name}]`;
}

export const AutofixProgressTests: ProgressTest[] = [{
    test: /About to transform .* autofix '(.*)'/i,
    phase: "$1",
}];

/**
 * Default ReportProgress for running autofixes
 */
export const AutofixProgressReporter: ReportProgress = testProgressReporter(...AutofixProgressTests);

/**
 * Extract author information from the current goal invocation
 */
export type ExtractAuthor = (gi: GoalInvocation) => Promise<{ name: string, email: string } | undefined>;

export const NoOpExtractAuthor: ExtractAuthor = async () => {
    return undefined;
};

export const DefaultExtractAuthor: ExtractAuthor = async gi => {
    const { goalEvent } = gi;
    const name = _.get(goalEvent, "push.after.author.name");
    const email = _.get(goalEvent, "push.after.author.emails[0].address");
    if (!!name && !!email) {
        return {
            name,
            email,
        };
    } else {
        return undefined;
    }
};
