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

import { PushImpactListenerInvocation } from "../listener/PushImpactListener";
import { PushRegistration } from "./PushRegistration";

/**
 * A code action response that affects delivery:
 * failing the current goal or requiring approval,
 * causing dependent goals to fail or wait.
 */
export enum PushReactionResponse {

    /**
     * Fail execution of the present goalset. Any dependent goals will stop.
     * Will not stop execution of non-dependent goals.
     */
    failGoals = "fail",

    /**
     * Require approval to proceed to dependent goals in the present goalset.
     */
    requireApprovalToProceed = "requireApproval",
}

/**
 * Optional PushReactionResponse included in a return value.
 */
export interface HasCodeActionResponse {

    /**
     * Response affecting further execution of the current goalset.
     */
    response?: PushReactionResponse;
}

/**
 * Reaction on a push, with the code available.
 * Can optionally return a response that
 * determines whether to ask for approval or terminate current delivery flow.
 */
export type PushReaction<R> = (i: PushImpactListenerInvocation) => Promise<R & HasCodeActionResponse>;

/**
 * Used to register actions on a push that can potentially
 * influence downstream goals. Will be invoked if a PushReactionGoal has
 * been set for the given push.
 * Use ReviewerRegistration if you want to return a structured review.
 */
export type PushReactionRegistration<R = any> = PushRegistration<PushReaction<R>>;

/**
 * Something we can register as a push reaction
 */
export type PushReactionRegisterable<R = any> = PushReactionRegistration | PushReaction<R>;

function isPushReactionRegistration(a: PushReactionRegisterable<any>): a is PushReactionRegistration {
    const maybe = a as PushRegistration<any>;
    return !!maybe.name && !!maybe.action;
}

/**
 * Convert an action function to a PushReaction if necessary
 * @param {PushReactionRegisterable<any>} prr
 * @return {PushReactionRegistration}
 */
export function toPushReactionRegistration(prr: PushReactionRegisterable<any>): PushReactionRegistration {
    return isPushReactionRegistration(prr) ? prr : {
        name: "Raw push reaction",
        action: prr,
    };
}

/**
 * Base options object for registrations that process selective files
 */
export interface SelectiveCodeActionOptions {

    /**
     * Run only on affected files?
     */
    considerOnlyChangedFiles: boolean;
}
