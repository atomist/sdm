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

import { failure, logger, } from "@atomist/automation-client";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import * as _ from "lodash";
import { AddressChannels } from "../../api/context/addressChannels";
import { ExecuteGoal, GoalInvocation, } from "../../api/goal/GoalInvocation";
import { PushReactionResponse } from "../../api/registration/PushImpactListenerRegistration";
import { formatReviewerError, ReviewerError, } from "../../api/registration/ReviewerError";
import { ReviewListenerRegistration } from "../../api/registration/ReviewListenerRegistration";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";
import { AutoInspectRegistration } from "../../api/registration/AutoInspectRegistration";

/**
 * Execute auto inspections and route or react to review results using review listeners
 * @param {ProjectLoader} projectLoader
 * @param autoInspectRegistrations
 * @param {ReviewListener[]} reviewListeners
 * @return {ExecuteGoal}
 */
export function executeAutoInspects(projectLoader: ProjectLoader,
                                    autoInspectRegistrations: AutoInspectRegistration<any, any>[],
                                    reviewListeners: ReviewListenerRegistration[]): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { credentials, id, addressChannels } = goalInvocation;
        try {
            if (autoInspectRegistrations.length > 0) {
                logger.info("Planning inspection of %j with %d AutoInspects", id, autoInspectRegistrations.length);
                return projectLoader.doWithProject({ credentials, id, readOnly: true }, async project => {
                    const cri = {
                        ...await createPushImpactListenerInvocation(goalInvocation, project),
                        commandName: "autoInspection",
                    };
                    const relevantAutoInspects = await relevantCodeActions(autoInspectRegistrations, cri);
                    logger.info("Executing review of %j with %d relevant AutoInspects: [%s] of [%s]",
                        id, relevantAutoInspects.length,
                        relevantAutoInspects.map(a => a.name).join(),
                        autoInspectRegistrations.map(a => a.name).join());

                    const reviewsAndErrors: Array<{ review?: ProjectReview, error?: ReviewerError }> =
                        await Promise.all(relevantAutoInspects
                            .map(autoInspect => {
                                return autoInspect.inspection(project, cri)
                                    .then(async result => {
                                            try {
                                                if (!!autoInspect.onInspectionResult) {
                                                    await autoInspect.onInspectionResult(result, cri);
                                                }
                                            } catch {
                                                // Ignore errors
                                            }
                                            // Suppress non reviews
                                            return { review: isProjectReview(result) ? result : undefined };
                                        },
                                        error => ({ error }));
                            }));
                    const reviews: ProjectReview[] = reviewsAndErrors.filter(r => !!r.review)
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
                    const reviewResponses = await Promise.all(reviewListeners.map(async l => {
                        try {
                            return l.listener(rli);
                        } catch (err) {
                            logger.error("Review listener %s failed. Stack: %s", l.name, err.stack);
                            await rli.addressChannels(`:crying_cat_face: Review listener '${l.name}' failed: ${err.message}`);
                            return PushReactionResponse.failGoals;
                        }
                    }));
                    const result = {
                        code: reviewResponses.some(rr => !!rr && rr === PushReactionResponse.failGoals) ? 1 : 0,
                        requireApproval: reviewResponses.some(rr => !!rr && rr === PushReactionResponse.requireApprovalToProceed),
                    };
                    logger.info("Review responses are %j, result=%j", reviewResponses, result);
                    return result;
                });
            } else {
                // No reviewers
                return { code: 0, requireApproval: false };
            }
        } catch (err) {
            logger.error("Error executing review of %j with %d reviewers: $s",
                id, autoInspectRegistrations.length, err.message);
            return failure(err);
        }
    };
}

function isProjectReview(o: any): o is ProjectReview {
    const r = o as ProjectReview;
    return !!r.repoId && r.comments !== undefined;
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
