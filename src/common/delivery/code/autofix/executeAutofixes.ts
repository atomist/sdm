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

import { HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { editRepo } from "@atomist/automation-client/operations/support/editorUtils";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ExecuteGoalInvocation, Executor, StatusForExecuteGoal } from "../../../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { OnAnyPendingStatus } from "../../../../typings/types";
import { PushTestInvocation } from "../../../listener/GoalSetter";
import { addressChannelsFor, messageDestinationsFor } from "../../../slack/addressChannels";
import { teachToRespondInEventHandler } from "../../../slack/contextMessageRouting";
import { AutofixRegistration, relevantCodeActions } from "../codeActionRegistrations";

export type CommitShape = OnAnyPendingStatus.Commit;

/**
 * Execute autofixes against this push
 * Throw an error on failure
 * @param {CommitShape} commit
 * @param {HandlerContext} context
 * @param {ProjectOperationCredentials} credentials
 * @param {AutofixRegistration[]} registrations
 * @return {Promise<void>}
 */
export function executeAutofixes(registrations: AutofixRegistration[]): Executor {
    return async (status: StatusForExecuteGoal.Status,
                  context: HandlerContext,
                  egi: ExecuteGoalInvocation): Promise<HandlerResult> => {
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
                    await
                        editRepo(teachToRespondInEventHandler(context, messageDestinationsFor(commit.repo, context)),
                            pti.project, singleEditor, editMode);
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
