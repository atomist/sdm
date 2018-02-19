/*
 * Copyright © 2017 Atomist, Inc.
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

import * as _ from "lodash";

import { GraphQL, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { OnAnyPendingStatus, StatusState } from "../../../../typings/types";
import { addressChannelsFor } from "../../../commands/editors/toclient/addressChannels";
import { createStatus } from "../../../commands/editors/toclient/ghub";
import { ScanContext } from "../phases/core";
import { ContextToPlannedPhase } from "../phases/httpServicePhases";
import { AnyProjectEditor, ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { BranchCommit, commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";

/**
 * Perform arbitrary actions (besides reviewing and returning a structured type)
 * in response to the contents of this repo
 */
export type CodeReaction = (p: GitProject, ctx: HandlerContext) => Promise<any>;

/**
 * Scan code on a push to master, invoking ProjectReviewers and arbitrary CodeReactions.
 * Run any autofix editors.
 * Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code",
    GraphQL.subscriptionFromFile("../../../../../../graphql/subscription/OnAnyPendingStatus.graphql",
        __dirname))
export class WithCodeOnPendingScanStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private editorChain: ProjectEditor;

    constructor(private context: string,
                private projectReviewers: ProjectReviewer[],
                private inspections: CodeReaction[],
                editors: AnyProjectEditor[] = []) {
        this.editorChain = editors.length > 0 ? chainEditors(...editors) : undefined;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        if (status.context !== params.context || status.state !== "pending") {
            logger.warn(`I was looking for ${params.context} being pending, but I heard about ${status.context} being ${status.state}`);
            return Promise.resolve(Success);
        }

        const addressChannels = addressChannelsFor(commit.repo, ctx);

        const p = await GitCommandGitProject.cloned(creds, id);
        const review: ProjectReview =
            await Promise.all(params.projectReviewers
                .map(reviewer => reviewer(p, ctx, params as any)))
                .then(reviews => consolidate(reviews));
        const inspections: Promise<any> =
            Promise.all(params.inspections
                .map(inspection => inspection(p, ctx)));
        await inspections;

        if (params.editorChain) {
            // TODO parameterize this
            const editMode: BranchCommit = {
                branch: commit.pushes[0].branch,
                message: "Autofixes",
            };
            logger.info("Editing %j with mode=%j", id, editMode);
            await editOne(ctx, creds, params.editorChain, editMode,
                new SimpleRepoId(id.owner, id.repo));
        }

        if (review.comments.length === 0) {
            await markScanned(p.id as GitHubRepoRef, params.context, "success", creds);
        } else {
            // TODO might want to raise issue
            await addressChannels(`${review.comments} review issues found`)
                .then(() => markScanned(p.id as GitHubRepoRef, params.context, "failure", creds));
        }
        return Success;
    }
}

export const ScanBase = "https://scan.atomist.com";

// TODO this should take a URL with detailed information
function markScanned(id: GitHubRepoRef, context: string, state: StatusState, creds: ProjectOperationCredentials): Promise<any> {
    const phase = ContextToPlannedPhase[context];
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`, // ${ApprovalGateParam}`,
        context: ScanContext,
        description: `Completed ${phase.name}`,
    });
}

function consolidate(reviews: ProjectReview[]): ProjectReview {
    // TODO check they are all the same id and that there's more than one
    return {
        repoId: reviews[0].repoId,
        comments: _.flatten(reviews.map(review => review.comments)),
    };
}
