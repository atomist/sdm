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

import {
    failure,
    logger,
    ProjectReview,
    RepoRef,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { AddressChannels } from "../../api/context/addressChannels";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { ParametersInvocation } from "../../api/listener/ParametersInvocation";
import { AutoInspectRegistration } from "../../api/registration/AutoInspectRegistration";
import { PushReactionResponse } from "../../api/registration/PushImpactListenerRegistration";
import {
    formatReviewerError,
    ReviewerError,
} from "../../api/registration/ReviewerError";
import { ReviewListenerRegistration } from "../../api/registration/ReviewListenerRegistration";
import { minimalClone } from "../goal/minimalClone";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute auto inspections and route or react to review results using review listeners
 * @param autoInspectRegistrations
 * @param reviewListeners listeners to respond to reviews
 * @return {ExecuteGoal}
 */
export function executeAutoInspects(autoInspectRegistrations: Array<AutoInspectRegistration<any, any>>,
                                    reviewListeners: ReviewListenerRegistration[]): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { sdmGoal, configuration, credentials, id } = goalInvocation;
        try {
            if (autoInspectRegistrations.length === 0) {
                return { code: 0, description: "No code inspections apply", requireApproval: false };
            }
            logger.info("Planning inspection of %j with %d AutoInspects", id, autoInspectRegistrations.length);
            return configuration.sdm.projectLoader.doWithProject({
                credentials,
                id,
                readOnly: true,
                cloneOptions: minimalClone(sdmGoal.push, { detachHead: true }),
            }, applyCodeInspections(goalInvocation, autoInspectRegistrations, reviewListeners));
        } catch (err) {
            logger.error("Error executing review of %j with %d reviewers: %s",
                id, autoInspectRegistrations.length, err.message);
            logger.warn(err.stack);
            return failure(err);
        }
    };
}

function applyCodeInspections(
    goalInvocation: GoalInvocation,
    autoInspectRegistrations: Array<AutoInspectRegistration<any, any>>,
    reviewListeners: ReviewListenerRegistration[]) {
    return async project => {
        const { id, addressChannels } = goalInvocation;
        const cri = await createPushImpactListenerInvocation(goalInvocation, project);
        const relevantAutoInspects = await relevantCodeActions(autoInspectRegistrations, cri);
        logger.info("Executing review of %j with %d relevant AutoInspects: [%s] of [%s]",
            id, relevantAutoInspects.length,
            relevantAutoInspects.map(a => a.name).join(),
            autoInspectRegistrations.map(a => a.name).join());

        const responsesFromOnInspectionResult: PushReactionResponse[] = [];
        const reviewsAndErrors: Array<{ review?: ProjectReview, error?: ReviewerError }> =
            await Promise.all(relevantAutoInspects
                .map(autoInspect => {
                    const cli: ParametersInvocation<any> = {
                        addressChannels: goalInvocation.addressChannels,
                        context: goalInvocation.context,
                        credentials: goalInvocation.credentials,
                        parameters: autoInspect.parametersInstance,
                    };
                    return autoInspect.inspection(project, cli)
                        .then(async inspectionResult => {
                            try {
                                if (!!autoInspect.onInspectionResult) {
                                    const r = await autoInspect.onInspectionResult(inspectionResult, cli);
                                    if (!!r) {
                                        responsesFromOnInspectionResult.push(r);
                                    }
                                }
                            } catch {
                                // Ignore errors
                            }
                            // Suppress non reviews
                            return { review: isProjectReview(inspectionResult) ? inspectionResult : undefined };
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
        const responsesFromReviewListeners = await Promise.all(reviewListeners.map(async l => {
            try {
                return (await l.listener(rli)) || PushReactionResponse.proceed;
            } catch (err) {
                logger.error("Review listener %s failed. Stack: %s", l.name, err.stack);
                await rli.addressChannels(`:crying_cat_face: Review listener '${l.name}' failed: ${err.message}`);
                return PushReactionResponse.failGoals;
            }
        }));
        const allReviewResponses = responsesFromOnInspectionResult.concat(responsesFromReviewListeners);
        const result = {
            code: allReviewResponses.some(rr => !!rr && rr === PushReactionResponse.failGoals) ? 1 : 0,
            requireApproval: allReviewResponses.some(rr => !!rr && rr === PushReactionResponse.requireApprovalToProceed),
        };
        logger.info("Review responses are %j, result=%j", responsesFromReviewListeners, result);
        return result;
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
