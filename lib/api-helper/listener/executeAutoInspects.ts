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
import { PushAwareParametersInvocation } from "../../api/registration/PushAwareParametersInvocation";
import { PushImpactResponse } from "../../api/registration/PushImpactListenerRegistration";
import {
    formatReviewerError,
    ReviewerError,
} from "../../api/registration/ReviewerError";
import { ReviewListenerRegistration } from "../../api/registration/ReviewListenerRegistration";
import { SdmGoalState } from "../../typings/types";
import { minimalClone } from "../goal/minimalClone";
import { PushListenerInvocation } from "./../../api/listener/PushListener";
import { ReviewListenerInvocation } from "./../../api/listener/ReviewListener";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

export interface AutoInspectOptions {
    registrations: Array<AutoInspectRegistration<any, any>>;
    listeners: ReviewListenerRegistration[];
    reportToSlack: boolean;
}

/**
 * Execute auto inspections and route or react to review results using review listeners
 * @param autoInspectRegistrations
 * @param reviewListeners listeners to respond to reviews
 * @return {ExecuteGoal}
 */
export function executeAutoInspects(options: AutoInspectOptions): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { sdmGoal, configuration, credentials, id } = goalInvocation;
        try {
            if (options.registrations.length === 0) {
                return { code: 0, description: "No code inspections configured", requireApproval: false };
            }
            logger.info("Planning inspection of %j with %d AutoInspects", id, options.registrations.length);
            return configuration.sdm.projectLoader.doWithProject({
                credentials,
                id,
                readOnly: true,
                cloneOptions: minimalClone(sdmGoal.push, { detachHead: true }),
            }, applyCodeInspections(goalInvocation, options));
        } catch (err) {
            logger.error("Error executing review of %j with %d reviewers: %s",
                id, options.registrations.length, err.message);
            logger.warn(err.stack);
            return failure(err);
        }
    };
}

// tslint:disable
/**
 * each inspection can return a result, which may be turned into a PushImpactResponse by its onInspectionResult,
 * OR it may return a ProjectReview, which will be processed by each ProjectReviewListener. The Listener may also return a PushImpactResponse.
 * Each of these PushReactionResponses may instruct the AutoInspect goal to fail or to require approval.
 *
 * ROD: which of these paths is deprecated? I'm guessing the ReviewListener is deprecated
 * and the onInspectionResult is the way to do this in the future.
 *
 * ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼     per AutoInspectRegistration      ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼              ▽▽▽▽▽▽▽▽  per Listener  ▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽▽
 *                         ┌────────────────────┐                                                                           ┌────────────────────┐
 *                         │                    │                                                                           │                    │
 *                         │                    │                              is a                                         │                    │
 *                         │                    │                         ProjectReview?                                    │                    │
 *                         │                    │                               Λ                                           │                    │
 *  ┌───────────┐          │                    │           ┌──────────┐       ╱ ╲     ┌────────────┐      consolidate      │      Listener      │          ┌────────────────────┐
 *  │  Project  │─────────▶│     Inspection     │────┬─────▶│   any    │─────▶▕   ▏───▶│   Review   │═════▶ with other ────▶│                    │─────┬───▶│PushImpactResponse│════╗
 *  └───────────┘          │                    │    │      └──────────┘       ╲ ╱     └────────────┘        Reviews        │                    │          └────────────────────┘    ║
 *                         │                    │    │                          V                                           │                    │     │                              ║
 *                         │                    │    │                                                                      │                    │                                    ║
 *                         │                    │    │                                                                      │                    │     │                              ║
 *                         │                    │    │                                                                      └────────────────────┘                                    ║
 *                         └────────────────────┘    │                                                                                 │               │                              ║
 *                                    │              ?     ┌────────────┐                                                                                                             ║
 *                                                   │     │            │                                                              └ ─ ─ ─ "fail"─ ┘                              ║
 *                                    │              │     │            │                                                                      and send to Slack                      ║     ┌──────────────────────────┐
 *                                                   │     │OnInspection│        ┌────────────────────┐                                                                               ║     │     check for "fail"     │      ┌──────────────────┐
 *                                    │              └────▶│   Result   │────?──▶│PushResponseResponse│═══════════════════════════════════════════════════════════════════════════════╩════▶│    check for "require    │─────▶│ExecuteGoalResult │
 *                                                         │            │        └────────────────────┘                                                                                     │        approval"         │      └──────────────────┘
 *                                    │                    │            │                                                                                                                   └──────────────────────────┘
 *                                                         │            │
 *                                    │                    └────────────┘
 *                                                                │
 *                                    │
 *                                    ▼                           │
 *                              ┌──────────┐                      ▼
 *                              │  Error   │                (errors are
 *                              └──────────┘                  ignored)
 */

// tslint:enable
/**
 * Apply code inspections
 * @param goalInvocation
 * @param autoInspectRegistrations
 * @param reviewListeners
 */
function applyCodeInspections(goalInvocation: GoalInvocation,
                              options: AutoInspectOptions) {
    return async project => {
        const { addressChannels } = goalInvocation;
        const cri = await createPushImpactListenerInvocation(goalInvocation, project);
        const relevantAutoInspects = await relevantCodeActions(options.registrations, cri);

        const inspectionReviewsAndResults: Array<{ review?: ProjectReview, error?: ReviewerError, response?: PushImpactResponse }> =
            await Promise.all(relevantAutoInspects
                .map(async autoInspect => {
                    const cli: ParametersInvocation<any> = createParametersInvocation(goalInvocation, autoInspect);
                    const papi: PushAwareParametersInvocation<any> = {
                        ...cli,
                        push: cri,
                    };
                    try {
                        const inspectionResult = await autoInspect.inspection(project, papi);
                        const review = isProjectReview(inspectionResult) ? inspectionResult : undefined;
                        const response = autoInspect.onInspectionResult &&
                            await autoInspect.onInspectionResult(inspectionResult, cli).catch(err => undefined); // ignore errors
                        return { review, response };
                    } catch (error) {
                        return { error };
                    }
                }));

        const reviewerErrors = inspectionReviewsAndResults.filter(e => !!e.error)
            .map(e => e.error);
        // tslint:disable-next-line:no-boolean-literal-compare
        if (options.reportToSlack === true) {
            sendErrorsToSlack(reviewerErrors, addressChannels);
        }

        const responsesFromOnInspectionResult: PushImpactResponse[] = inspectionReviewsAndResults.filter(r => !!r.response)
            .map(r => r.response);

        const reviews: ProjectReview[] = inspectionReviewsAndResults.filter(r => !!r.review)
            .map(r => r.review);
        const responsesFromReviewListeners = await gatherResponsesFromReviewListeners(reviews, options.listeners, cri);

        const allReviewResponses = responsesFromOnInspectionResult.concat(responsesFromReviewListeners);
        const result = {
            code: allReviewResponses.some(rr => !!rr && rr === PushImpactResponse.failGoals) ? 1 : 0,
            state: allReviewResponses.some(rr => !!rr && rr === PushImpactResponse.requireApprovalToProceed)
                ? SdmGoalState.waiting_for_approval : undefined,
        };
        logger.info("Review responses are %j, result=%j", responsesFromReviewListeners, result);
        return result;
    }
        ;
};

async function gatherResponsesFromReviewListeners(reviews: ProjectReview[],
                                                  reviewListeners: ReviewListenerRegistration[],
                                                  pli: PushListenerInvocation):
    Promise<PushImpactResponse[]> {
    const review = consolidate(reviews, pli.id);
    logger.info("Consolidated review of %j has %s comments", pli.id, review.comments.length);

    return Promise.all(reviewListeners.map(responseFromOneListener({ ...pli, review })));
}

function responseFromOneListener(rli: ReviewListenerInvocation) {
    return async (l: ReviewListenerRegistration): Promise<PushImpactResponse> => {
        try {
            return (await l.listener(rli)) || PushImpactResponse.proceed;
        } catch (err) {
            logger.error("Review listener %s failed. Stack: %s", l.name, err.stack);
            await rli.addressChannels(`:crying_cat_face: Review listener '${l.name}' failed: ${err.message}`);
            return PushImpactResponse.failGoals;
        }
    };
}

function createParametersInvocation(goalInvocation: GoalInvocation,
                                    autoInspect: AutoInspectRegistration<any, any>) {
    return {
        addressChannels: goalInvocation.addressChannels,
        context: goalInvocation.context,
        credentials: goalInvocation.credentials,
        parameters: autoInspect.parametersInstance,
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

function sendErrorsToSlack(errors: ReviewerError[],
                           addressChannels: AddressChannels) {
    errors.forEach(async e => {
        await addressChannels(formatReviewerError(e));
    });
}
