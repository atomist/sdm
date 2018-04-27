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

/* tslint:disable:no-unused-variable */

import * as _ from "lodash";

import { failure, logger } from "@atomist/automation-client";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { Project } from "@atomist/automation-client/project/Project";
import { PushImpactListenerInvocation } from "../../../listener/PushImpactListener";
import { ActionReviewResponse, ReviewListener } from "../../../listener/ReviewListener";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { AddressChannels } from "../../../slack/addressChannels";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../goals/support/reportGoalError";
import { relevantCodeActions } from "../CodeActionRegistration";
import { createPushImpactListenerInvocation } from "../createPushImpactListenerInvocation";
import { formatReviewerError, ReviewerError } from "./ReviewerError";
import { ReviewerRegistration } from "./ReviewerRegistration";

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
                    logger.info("Executing review of %j with %d relevant reviewers", id, relevantCodeActions.length);

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

                    const review = consolidate(reviews);
                    const rli = {
                        ...cri,
                        review,
                    };
                    sendErrorsToSlack(reviewerErrors, addressChannels);
                    const reviewResponses = await Promise.all(reviewListeners.map(l => l(rli)));
                    const result = {
                        code: reviewResponses.includes(ActionReviewResponse.fail) ? 1 : 0,
                        requireApproval: reviewResponses.includes(ActionReviewResponse.requireApproval),
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

function consolidate(reviews: ProjectReview[]): ProjectReview {
    // TODO check they are all the same id and that there's more than one
    return {
        repoId: reviews[0].repoId,
        comments: _.flatten(reviews.map(review => review.comments)),
    };
}

function sendErrorsToSlack(errors: ReviewerError[], addressChannels: AddressChannels) {
    errors.forEach(async e => {
        await addressChannels(formatReviewerError(e));
    });
}
