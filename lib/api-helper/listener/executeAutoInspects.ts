import { ReviewListenerRegistration } from './../../api/registration/ReviewListenerRegistration';
import { ReviewListener, ReviewListenerInvocation } from './../../api/listener/ReviewListener';
import { PushListenerInvocation } from './../../api/listener/PushListener';
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
export function executeAutoInspects(
    autoInspectRegistrations: Array<AutoInspectRegistration<any, any>>,
    reviewListeners: ReviewListenerRegistration[]): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { sdmGoal, configuration, credentials, id } = goalInvocation;
        try {
            if (autoInspectRegistrations.length === 0) {
                return { code: 0, description: "No code inspections configured", requireApproval: false };
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


// ts-lint:disable:max-line-length
/**
 * each inspection can return a result, which may be turned into a PushReactionResponse by its onInspectionResult,
 * OR it may return a ProjectReview, which will be processed by each ProjectReviewListener. The Listener may also return a PushReactionResponse.
 * Each of these PushReactionResponses may instruct the AutoInspect goal to fail or to require approval.
 *
▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼     per AutoInspectRegistration      ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼              ▽▽▽▽▽▽▽▽  per Listener  ▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽
                        ┌────────────────────┐                                                                           ┌────────────────────┐
                        │                    │                                                                           │                    │
                        │                    │                              is a                                         │                    │
                        │                    │                         ProjectReview?                                    │                    │
                        │                    │                               Λ                                           │                    │
 ┌───────────┐          │                    │           ┌──────────┐       ╱ ╲     ┌────────────┐      consolidate      │      Listener      │          ┌────────────────────┐
 │  Project  │─────────▶│     Inspection     │────┬─────▶│   any    │─────▶▕   ▏───▶│   Review   │═════▶ with other ────▶│                    │─────┬───▶│PushReactionResponse│════╗
 └───────────┘          │                    │    │      └──────────┘       ╲ ╱     └────────────┘        Reviews        │                    │          └────────────────────┘    ║
                        │                    │    │                          V                                           │                    │     │                              ║
                        │                    │    │                                                                      │                    │                                    ║
                        │                    │    │                                                                      │                    │     │                              ║
                        │                    │    │                                                                      └────────────────────┘                                    ║
                        └────────────────────┘    │                                                                                 │               │                              ║
                                   │              ?     ┌────────────┐                                                                                                             ║
                                                  │     │            │                                                              └ ─ ─ ─ "fail"─ ┘                              ║
                                   │              │     │            │                                                                      and send to Slack                      ║     ┌──────────────────────────┐
                                                  │     │OnInspection│        ┌────────────────────┐                                                                               ║     │     check for "fail"     │      ┌──────────────────┐
                                   │              └────▶│   Result   │────?──▶│PushResponseResponse│═══════════════════════════════════════════════════════════════════════════════╩════▶│    check for "require    │─────▶│ExecuteGoalResult │
                                                        │            │        └────────────────────┘                                                                                     │        approval"         │      └──────────────────┘
                                   │                    │            │                                                                                                                   └──────────────────────────┘
                                                        │            │
                                   │                    └────────────┘
                                                               │
                                   │
                                   ▼                           │
                             ┌──────────┐                      ▼
                             │  Error   │                (errors are
                             └──────────┘                  ignored)
 * 
 * @param goalInvocation 
 * @param autoInspectRegistrations 
 * @param reviewListeners 
 */
function applyCodeInspections(
    goalInvocation: GoalInvocation,
    autoInspectRegistrations: Array<AutoInspectRegistration<any, any>>,
    reviewListeners: ReviewListenerRegistration[]) {
    return async project => {
        const { id, addressChannels } = goalInvocation;
        const cri = await createPushImpactListenerInvocation(goalInvocation, project);
        const relevantAutoInspects = await relevantCodeActions(autoInspectRegistrations, cri);

        const inspectionReviewsAndResults: Array<{ review?: ProjectReview, error?: ReviewerError, response?: PushReactionResponse }> =
            await Promise.all(relevantAutoInspects
                .map(async autoInspect => {
                    const cli: ParametersInvocation<any> = createParametersInvocation(goalInvocation, autoInspect);
                    try {
                        const inspectionResult = await autoInspect.inspection(project, cli)
                        const review = isProjectReview(inspectionResult) ? inspectionResult : undefined;
                        const response = autoInspect.onInspectionResult &&
                            await autoInspect.onInspectionResult(inspectionResult, cli).catch(err => undefined) // ignore errors
                        return { review, response };
                    } catch (error) {
                        return { error }
                    }
                }));

        const reviewerErrors = inspectionReviewsAndResults.filter(e => !!e.error)
            .map(e => e.error);
        sendErrorsToSlack(reviewerErrors, addressChannels);

        const responsesFromOnInspectionResult: PushReactionResponse[] = inspectionReviewsAndResults.filter(r => !!r.response)
            .map(r => r.response);

        const reviews: ProjectReview[] = inspectionReviewsAndResults.filter(r => !!r.review)
            .map(r => r.review);
        const responsesFromReviewListeners = await gatherResponsesFromReviewListeners(reviews, reviewListeners, cri);

        const allReviewResponses = responsesFromOnInspectionResult.concat(responsesFromReviewListeners);
        const result = {
            code: allReviewResponses.some(rr => !!rr && rr === PushReactionResponse.failGoals) ? 1 : 0,
            requireApproval: allReviewResponses.some(rr => !!rr && rr === PushReactionResponse.requireApprovalToProceed),
        };
        logger.info("Review responses are %j, result=%j", responsesFromReviewListeners, result);
        return result;
    };
}

async function gatherResponsesFromReviewListeners(reviews: ProjectReview[], reviewListeners: ReviewListenerRegistration[], pli: PushListenerInvocation):
    Promise<PushReactionResponse[]> {
    const review = consolidate(reviews, pli.id);
    logger.info("Consolidated review of %j has %s comments", pli.id, review.comments.length);

    return Promise.all(reviewListeners.map(responseFromOneListener({ ...pli, review })));
}

function responseFromOneListener(rli: ReviewListenerInvocation) {
    return async (l: ReviewListenerRegistration): Promise<PushReactionResponse> => {
        try {
            return (await l.listener(rli)) || PushReactionResponse.proceed;
        } catch (err) {
            logger.error("Review listener %s failed. Stack: %s", l.name, err.stack);
            await rli.addressChannels(`:crying_cat_face: Review listener '${l.name}' failed: ${err.message}`);
            return PushReactionResponse.failGoals;
        }
    }
}

function createParametersInvocation(goalInvocation: GoalInvocation, autoInspect: AutoInspectRegistration<any, any>) {
    return {
        addressChannels: goalInvocation.addressChannels,
        context: goalInvocation.context,
        credentials: goalInvocation.credentials,
        parameters: autoInspect.parametersInstance,
    }
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
