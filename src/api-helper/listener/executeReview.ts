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

import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as _ from "lodash";

import { failure, logger } from "@atomist/automation-client";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { AddressChannels } from "../../api/context/addressChannels";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { ReviewListener } from "../../api/listener/ReviewListener";
import { PushReactionResponse } from "../../api/registration/PushReactionRegistration";
import { formatReviewerError, ReviewerError } from "../../api/registration/ReviewerError";
import { ReviewerRegistration } from "../../api/registration/ReviewerRegistration";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute reviews and route or react to results using review listeners
 * @param {ProjectLoader} projectLoader
 * @param {ReviewerRegistration[]} reviewerRegistrations
 * @param {ReviewListener[]} reviewListeners
 * @return {ExecuteGoalWithLog}
 */
export function executeReview(projectLoader: ProjectLoader,
                              reviewerRegistrations: ReviewerRegistration[],
                              reviewListeners: ReviewListener[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const {credentials, id, addressChannels} = rwlc;
        try {
            if (reviewerRegistrations.length > 0) {
                logger.info("Planning review of %j with %d reviewers", id, reviewerRegistrations.length);
                return projectLoader.doWithProject({credentials, id, readOnly: true}, async project => {
                    const cri: PushImpactListenerInvocation = await createPushImpactListenerInvocation(rwlc, project);
                    const relevantReviewers = await relevantCodeActions(reviewerRegistrations, cri);
                    logger.info("Executing review of %j with %d relevant reviewers: [%s] of [%s]",
                        id, relevantReviewers.length,
                        relevantReviewers.map(a => a.name).join(),
                        reviewerRegistrations.map(a => a.name).join());

                    const reviewsAndErrors: Array<{ review?: ProjectReview, error?: ReviewerError }> =
                        await Promise.all(relevantReviewers
                            .map(reviewer => {
                                return reviewer.action(cri)
                                    .then(rvw => ({review: rvw}),
                                        error => ({error}));
                            }));
                    const reviews = reviewsAndErrors.filter(r => !!r.review)
                        .map(r => r.review);
                    const reviewerErrors = reviewsAndErrors.filter(e => !!e.error)
                        .map(e => e.error);

                    const review = consolidate(reviews, id);
                    logger.info("Consolidated review of %j has %s comments", id, review.comments.length);

                    const rli = {
                        ...cri,
                        review,
                    };
                    sendErrorsToSlack(reviewerErrors, addressChannels);
                    const reviewResponses = await Promise.all(reviewListeners.map(l => l(rli)));
                    const result = {
                        code: reviewResponses.some(rr => !!rr && rr === PushReactionResponse.failGoals) ? 1 : 0,
                        requireApproval: reviewResponses.some(rr => !!rr && rr === PushReactionResponse.requireApprovalToProceed),
                    };
                    logger.info("Review responses are %j, result=%j", reviewResponses, result);
                    return result;
                });
            } else {
                // No reviewers
                return {code: 0, requireApproval: false};
            }
        } catch (err) {
            logger.error("Error executing review of %j with %d reviewers: $s",
                id, reviewerRegistrations.length, err.message);
            return failure(err);
        }
    };
}

function consolidate(reviews: ProjectReview[], repoId: RepoRef): ProjectReview {
    return {
        repoId,
        comments: _.flatten(reviews.map(review => review.comments)),
    };
}

function sendErrorsToSlack(errors: ReviewerError[], addressChannels: AddressChannels) {
    errors.forEach(async e => {
        await addressChannels(formatReviewerError(e));
    });
}
