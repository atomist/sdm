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
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { AnyProjectEditor, ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ProjectReview, ReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as slack from "@atomist/slack-messages";
import { Attachment, SlackMessage } from "@atomist/slack-messages";
import { AddressChannels, addressChannelsFor } from "../../../../../common/slack/addressChannels";
import { OnAnyPendingStatus, StatusState } from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { ContextToPlannedPhase, ScanContext } from "../../phases/httpServicePhases";

import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { deepLink } from "@atomist/automation-client/util/gitHub";
import { CodeReactionInvocation, CodeReactionListener } from "../../../../../common/listener/CodeReactionListener";
import { filesChangedSince } from "../../../../../util/git/filesChangedSince";
import { forApproval } from "../../verify/approvalGate";

/**
 * Scan code on a push to master, invoking ProjectReviewers and arbitrary CodeReactions.
 * Run any autofix editors.
 * Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnyPendingStatus.graphql"))
export class OnPendingScanStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private editorChain: ProjectEditor;

    constructor(private projectReviewers: ProjectReviewer[],
                private codeReactions: CodeReactionListener[],
                editors: AnyProjectEditor[] = [],
                private context: string = ScanContext) {
        this.editorChain = editors.length > 0 ? chainEditors(...editors) : undefined;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        if (status.context !== params.context || status.state !== "pending") {
            logger.warn(`I was looking for ${params.context} being pending, but I heard about ${status.context} being ${status.state}`);
            return Success;
        }

        const addressChannels = addressChannelsFor(commit.repo, context);
        try {
            const project = await GitCommandGitProject.cloned(credentials, id);
            const review: ProjectReview =
                await Promise.all(params.projectReviewers
                    .map(reviewer => reviewer(project, context, params as any)))
                    .then(reviews => consolidate(reviews));

            const push = commit.pushes[0];
            const filesChanged = push.before ? await filesChangedSince(project, push.before.sha) : [];

            const i: CodeReactionInvocation = {
                id,
                context,
                addressChannels,
                project,
                credentials,
                filesChanged,
            };
            const inspections: Promise<any> =
                Promise.all(params.codeReactions
                    .map(reaction => reaction(i)));
            await inspections;

            if (params.editorChain) {
                // TODO parameterize this
                const editMode: BranchCommit = {
                    branch: commit.pushes[0].branch,
                    message: "Autofixes",
                };
                logger.info("Editing %j with mode=%j", id, editMode);
                await editOne(context, credentials, params.editorChain, editMode,
                    new SimpleRepoId(id.owner, id.repo));
            }

            if (review.comments.length === 0) {
                await markScanned(project.id as GitHubRepoRef,
                    params.context, "success", credentials, false);
            } else {
                // TODO might want to raise issue
                // Fail it??
                await sendReviewToSlack("Review comments", review, context, addressChannels)
                    .then(() => markScanned(project.id as GitHubRepoRef,
                        params.context, "success", credentials, true));
            }
            return Success;
        } catch (err) {
            await markScanned(id,
                params.context, "error", credentials, false);
            return failure(err);
        }
    }
}

export const ScanBase = "https://scan.atomist.com";

// TODO this should take a URL with detailed information
function markScanned(id: GitHubRepoRef, context: string, state: StatusState,
                     creds: ProjectOperationCredentials, requireApproval: boolean): Promise<any> {
    const phase = ContextToPlannedPhase[context];
    const baseUrl = `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`;
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: requireApproval ? forApproval(baseUrl) : baseUrl,
        context: ScanContext,
        description: phase.completedDescription,
    });
}

function consolidate(reviews: ProjectReview[]): ProjectReview {
    // TODO check they are all the same id and that there's more than one
    return {
        repoId: reviews[0].repoId,
        comments: _.flatten(reviews.map(review => review.comments)),
    };
}

async function sendReviewToSlack(title: string, pr: ProjectReview, ctx: HandlerContext, addressChannels: AddressChannels) {
    const mesg: SlackMessage = {
        text: `*${title} on ${pr.repoId.owner}/${pr.repoId.repo}*`,
        attachments: pr.comments.map(c => reviewCommentToAttachment(pr.repoId as GitHubRepoRef, c)),
    };
    await addressChannels(mesg);
    return Success;
}

function reviewCommentToAttachment(grr: GitHubRepoRef, rc: ReviewComment): Attachment {
    return {
        color: "#ff0000",
        author_name: rc.category,
        author_icon: "https://image.shutterstock.com/z/stock-vector-an-image-of-a-red-grunge-x-572409526.jpg",
        text: `${slack.url(deepLink(grr, rc.sourceLocation), "jump to")} ${rc.detail}`,
        mrkdwn_in: ["text"],
        fallback: "error",
        actions: !!rc.fix ? [
            buttonForCommand({text: "Fix"}, rc.fix.command, rc.fix.params),
        ] : [],
    };
}
