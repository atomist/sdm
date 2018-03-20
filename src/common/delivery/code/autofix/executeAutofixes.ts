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

import { HandlerContext, logger, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { editRepo } from "@atomist/automation-client/operations/support/editorUtils";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { PushTestInvocation } from "../../../listener/PushTest";
import { addressChannelsFor, messageDestinationsFor } from "../../../slack/addressChannels";
import { teachToRespondInEventHandler } from "../../../slack/contextMessageRouting";
import {
    ExecuteGoalInvocation,
    ExecuteGoalResult,
    GoalExecutor,
    StatusForExecuteGoal,
} from "../../goals/goalExecution";
import { AutofixRegistration, relevantCodeActions } from "../codeActionRegistrations";

/**
 * Execute autofixes against this push
 * Throw an error on failure
 * @param {AutofixRegistration[]} registrations
 * @return GoalExecutor
 */
export function executeAutofixes(registrations: AutofixRegistration[]): GoalExecutor {
    return async (status: StatusForExecuteGoal.Status,
                  context: HandlerContext,
                  egi: ExecuteGoalInvocation): Promise<ExecuteGoalResult> => {
        try {
            const commit = status.commit;
            const credentials = {token: egi.githubToken};
            if (registrations.length > 0) {
                const push = commit.pushes[0];
                const editableRepoRef = new GitHubRepoRef(commit.repo.owner, commit.repo.name, push.branch);
                const project = await GitCommandGitProject.cloned(credentials, editableRepoRef);
                const pti: PushTestInvocation = {
                    id: editableRepoRef,
                    project,
                    credentials,
                    context,
                    addressChannels: addressChannelsFor(commit.repo, context),
                    push,
                };
                const editors = await relevantCodeActions<AutofixRegistration>(registrations, pti);
                logger.info("Will apply %d eligible autofixes of %d to %j",
                    editors.length, registrations.length, pti.id);
                const singleEditor: ProjectEditor = editors.length > 0 ? chainEditors(...editors.map(e => e.action)) : undefined;
                if (!!singleEditor) {
                    const editMode: BranchCommit = {
                        branch: pti.push.branch,
                        message: `Autofixes (${editors.map(e => e.name).join()})\n\n[atomist]`,
                    };
                    logger.info("Editing %s with mode=%j", pti.id.url, editMode);
                    const editResult = await editRepo(teachToRespondInEventHandler(context, messageDestinationsFor(commit.repo, context)),
                            pti.project, singleEditor, editMode);
                    if (editResult.edited) {
                        // Send back an error code, because we want to stop execution after this build
                        return { code: 1, message: "Edited"};
                    }
                }
                return Success;
            }
        } catch (err) {
            logger.warn("Autofixing failed with " + err.message);
            logger.warn("Ignoring failure");
            return Success;
        }
    };
}
