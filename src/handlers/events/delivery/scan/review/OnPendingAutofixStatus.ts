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

import {
    EventFired,
    EventHandler,
    failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import {
    AnyProjectEditor,
    ProjectEditor,
} from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Goal } from "../../../../../common/goals/Goal";
import {
    OnAnyPendingStatus,
    StatusState,
} from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { forApproval } from "../../verify/approvalGate";

/**
 * Run any autofix editors on a push.
 * Set GitHub success status
 */
@EventHandler("Make autofixes", GraphQL.subscriptionFromFile(
    "../../../../../graphql/subscription/OnAnyPendingStatus",
    __dirname),
)
export class OnPendingAutofixStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private editorChain: ProjectEditor;

    constructor(public goal: Goal,
                private editors: AnyProjectEditor[] = []) {
        this.editorChain = editors.length > 0 ? chainEditors(...editors) : undefined;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        if (status.context !== params.goal.context || status.state !== "pending") {
            logger.warn(`I was looking for ${params.goal.context} being pending, but I heard about ${status.context} being ${status.state}`);
            return Success;
        }

        logger.info("Will apply %d autofixes to %j", params.editors.length, id);
        try {
            const project = await GitCommandGitProject.cloned(credentials, id);

            if (params.editorChain) {
                // TODO parameterize this
                const editMode: BranchCommit = {
                    branch: commit.pushes[0].branch,
                    message: "Autofixes\n\n[atomist]",
                };
                logger.info("Editing %j with mode=%j", id, editMode);
                await editOne(context, credentials, params.editorChain, editMode,
                    new SimpleRepoId(id.owner, id.repo));
            }

            await markStatus(project.id as GitHubRepoRef,
                params.goal, "success", credentials);

            return Success;
        } catch (err) {
            await markStatus(id,
                params.goal, "error", credentials);
            return failure(err);
        }
    }
}

function markStatus(id: GitHubRepoRef, goal: Goal, state: StatusState,
                    creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        context: goal.context,
        description: goal.completedDescription,
    });
}
