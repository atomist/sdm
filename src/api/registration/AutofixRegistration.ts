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

import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { CodeTransformOrTransforms } from "./CodeTransform";
import { SelectiveCodeActionOptions } from "./PushImpactListenerRegistration";
import { PushSelector } from "./PushRegistration";

export interface AutofixRegistrationOptions extends SelectiveCodeActionOptions {

    ignoreFailure: boolean;
}

/**
 * Register an autofix. This is a transform run on every commit that will make a
 * commit if necessary to the same branch.
 */
export interface AutofixRegistration<P = NoParameters> extends PushSelector {

    transform: CodeTransformOrTransforms<P>;

    options?: AutofixRegistrationOptions;

    /**
     * Parameters used for all transforms
     */
    parametersInstance?: P;
}
