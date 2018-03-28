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

import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ProjectListenerInvocation } from "../../listener/Listener";
import { PushTest } from "../../listener/PushTest";

export interface CodeActionRegistration<A> {

    name: string;

    pushTest?: PushTest;

    action: A;
}

export interface AutofixRegistrationOptions {

    ignoreFailure: boolean;
}

/**
 * Register an editor for autofix. An editor for autofix
 * should not rely on parameters being passed in. An existing editor can be wrapped
 * to use predefined parameters.
 * Any use of MessageClient.respond in an editor used in an autofix will be redirected to
 * linked channels as autofixes are normally invoked in an EventHandler and EventHandlers
 * do not support respond.
 */
export interface AutofixRegistration extends CodeActionRegistration<AnyProjectEditor> {

    options?: AutofixRegistrationOptions;

}

export interface ReviewerRegistrationOptions {

    /**
     * Run only on affected files?
     */
    reviewOnlyChangedFiles: boolean;
}

export interface ReviewerRegistration extends CodeActionRegistration<ProjectReviewer> {

    options?: ReviewerRegistrationOptions;
}

/**
 * Compute the relevant actions for this push
 * @param {Array<CodeActionRegistration<A>>} registrations
 * @param {ProjectListenerInvocation} pti
 * @return {Promise<A[]>}
 */
export function relevantCodeActions<A extends CodeActionRegistration<any>>(registrations: A[],
                                                                           pti: ProjectListenerInvocation): Promise<A[]> {
    return Promise.all(
        registrations.map(async t => (!t.pushTest || await t.pushTest.valueForPush(pti)) ? t : undefined))
        .then(elts => elts.filter(x => !!x));
}
