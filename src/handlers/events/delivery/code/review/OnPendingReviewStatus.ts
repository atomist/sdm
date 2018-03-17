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

import * as _ from "lodash";

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
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import {
    ProjectReview,
    ReviewComment,
} from "@atomist/automation-client/operations/review/ReviewResult";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { deepLink } from "@atomist/automation-client/util/gitHub";
import {
    Attachment,
    SlackMessage,
} from "@atomist/slack-messages";
import * as slack from "@atomist/slack-messages";
import {
    formatReviewerError,
    ReviewerError,
} from "../../../../../blueprint/ReviewerError";
import { Goal } from "../../../../../common/delivery/goals/Goal";
import { PushTest } from "../../../../../common/listener/GoalSetter";
import { AddressChannels, addressChannelsFor } from "../../../../../common/slack/addressChannels";
import {
    OnAnyPendingStatus,
    StatusState,
} from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { forApproval } from "../../verify/approvalGate";

export type ProjectTest = (p: Project) => Promise<boolean> | boolean;

export interface TargetedReviewer {

    projectTest: ProjectTest;

    projectReviewer: ProjectReviewer;
}

export type ReviewerRegistration = ProjectReviewer | TargetedReviewer;

/**
 * Scan code on a push, invoking ProjectReviewers.
 * Result is setting GitHub goal status.
 */
@EventHandler("Scan code", GraphQL.subscriptionFromFile(
    "../../../../../graphql/subscription/OnAnyPendingStatus",
    __dirname),
)
export class OnPendingReviewStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(public goal: Goal,
                private reviewerRegistrations: ReviewerRegistration[]) {
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

        const addressChannels = addressChannelsFor(commit.repo, context);
        try {
            if (params.reviewerRegistrations.length > 0) {
                const project = await GitCommandGitProject.cloned(credentials, id);
                const relevantReviewers = await toRelevantReviewers(params.reviewerRegistrations, project);
                const reviewsAndErrors: Array<{ review?: ProjectReview, error?: ReviewerError }> =
                    await Promise.all(relevantReviewers
                        .map(reviewer =>
                            reviewer(project, context, params as any)
                                .then(rvw => ({review: rvw}),
                                    error => ({error}))));
                const reviews = reviewsAndErrors.filter(r => !!r.review).map(r => r.review);
                const reviewerErrors = reviewsAndErrors.filter(e => !!e.error).map(e => e.error);

                const review = consolidate(reviews);

                if (review.comments.length === 0 && reviewerErrors.length === 0) {
                    await markScanned(id,
                        params.goal, StatusState.success, credentials, false);
                } else {
                    // TODO might want to raise issue
                    // Fail it??
                    await sendReviewToSlack("Review comments", review, context, addressChannels);
                    await sendErrorsToSlack(reviewerErrors, addressChannels);
                    await markScanned(project.id as GitHubRepoRef,
                        params.goal,  StatusState.success, credentials, true);
                }
            } else {
                // No reviewers
                await markScanned(id, params.goal, StatusState.success, credentials, false);
            }
            return Success;
        } catch (err) {
            await markScanned(id,
                params.goal,  StatusState.error, credentials, false);
            return failure(err);
        }
    }
}

function isTargetedReviewer(r: ReviewerRegistration): r is TargetedReviewer {
    return !!(r as TargetedReviewer).projectTest;
}

function toRelevantReviewers(registrations: ReviewerRegistration[], p: Project): Promise<ProjectReviewer[]> {
    const allTargeted: TargetedReviewer[] = registrations.map(r => isTargetedReviewer(r) ? r : {
        projectTest: () => true,
        projectReviewer: r,
    });
    return Promise.all(allTargeted.map(t => t.projectTest(p) ? t.projectReviewer : undefined))
        .then(elts => elts.filter(elt => !!elt));
}

export const ScanBase = "https://scan.atomist.com";

// TODO this should take a URL with detailed information
function markScanned(id: GitHubRepoRef, goal: Goal, state: StatusState,
                     creds: ProjectOperationCredentials, requireApproval: boolean): Promise<any> {
    const baseUrl = `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`;
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: requireApproval ? forApproval(baseUrl) : baseUrl,
        context: goal.context,
        description: goal.completedDescription,
    });
}

function consolidate(reviews: ProjectReview[]): ProjectReview {
    // TODO check they are all the same id and that there's more than one
    return {
        repoId: reviews[0].repoId,
        comments: _.flatten(reviews.map(review => review.comments)),
    };
}

async function sendReviewToSlack(title: string,
                                 pr: ProjectReview,
                                 ctx: HandlerContext,
                                 addressChannels: AddressChannels) {
    const mesg: SlackMessage = {
        text: `*${title} on ${pr.repoId.owner}/${pr.repoId.repo}*`,
        attachments: pr.comments.map(c => reviewCommentToAttachment(pr.repoId as GitHubRepoRef, c)),
    };
    await addressChannels(mesg);
    return Success;
}

function sendErrorsToSlack(errors: ReviewerError[], addressChannels: AddressChannels) {
    errors.forEach(async e => {
        await addressChannels(formatReviewerError(e));
    });
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
