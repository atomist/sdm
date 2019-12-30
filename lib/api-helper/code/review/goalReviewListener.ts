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

import { Severity } from "@atomist/automation-client/lib/operations/review/ReviewResult";
import { ReviewListener } from "../../../api/listener/ReviewListener";
import { PushImpactResponse } from "../../../api/registration/PushImpactListenerRegistration";
import { ReviewListenerRegistration } from "../../../api/registration/ReviewListenerRegistration";

/**
 * Return review listener function that returns `pir` if there are any
 * review comments with the provided severity.  The method will short
 * circuit once any comment with the provided severity is found.
 *
 * @param pir push impact response to return if there are comments
 *            with provided severities
 * @param severity severity that should trigger a return of `pir`,
 *                 "error" by default
 * @return ReviewListener that returns `pir` if any comments have
 *         a severity of `severity`, proceed otherwise
 */
export function severityReviewListener(pir: PushImpactResponse, severity: Severity = "error"): ReviewListener {
    return async rli => {
        if (rli && rli.review && rli.review.comments && rli.review.comments.some(c => c.severity === severity)) {
            return pir;
        }
        return PushImpactResponse.proceed;
    };
}

/**
 * Listener that fails the code inspection if the review has any
 * error comments.
 */
export const FailGoalIfErrorComments: ReviewListenerRegistration = {
    name: "Fail goal if any code inspections result in comments with severity error",
    listener: severityReviewListener(PushImpactResponse.failGoals),
};

/**
 * Listener that requires approval on the code inspection if the
 * review has any error comments.
 */
export const ApproveGoalIfErrorComments: ReviewListenerRegistration = {
    name: "Require approval if any code inspections result in comments with severity error",
    listener: severityReviewListener(PushImpactResponse.requireApprovalToProceed),
};

/**
 * Listener that fails the code inspection if the review has any
 * warn comments.
 */
export const FailGoalIfWarnComments: ReviewListenerRegistration = {
    name: "Fail goal if any code inspections result in comments with severity warn",
    listener: severityReviewListener(PushImpactResponse.failGoals, "warn"),
};

/**
 * Listener that requires approval on the code inspection if the
 * review has any warn comments.
 */
export const ApproveGoalIfWarnComments: ReviewListenerRegistration = {
    name: "Require approval if any code inspections result in comments with severity warn",
    listener: severityReviewListener(PushImpactResponse.requireApprovalToProceed, "warn"),
};
