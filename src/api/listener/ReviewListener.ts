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

import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { PushReactionResponse } from "../registration/PushReactionRegistration";
import { SdmListener } from "./Listener";
import { PushListenerInvocation } from "./PushListener";

/**
 * Invocation on a completed review.
 */
export interface ReviewListenerInvocation extends PushListenerInvocation {

    /**
     * Consolidated review
     */
    review: ProjectReview;
}

/**
 * Listener invoked when a review has been completed.
 * Listeners will be invoked even in the case of a clean review,
 * without errors or comments.
 */
export type ReviewListener = SdmListener<ReviewListenerInvocation, void | PushReactionResponse>;
