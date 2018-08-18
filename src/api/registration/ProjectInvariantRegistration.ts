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
import { ProjectReview, RemoteRepoRef } from "../project/exports";
import { AutofixRegistration } from "./AutofixRegistration";
import { CodeInspectionRegistration, InspectionActions } from "./CodeInspectionRegistration";
import { CodeTransformRegistration } from "./CodeTransformRegistration";

/**
 * Can register as a code inspection
 */
export interface ProjectInvariantRegistration<PARAMS = NoParameters>
    extends CodeInspectionRegistration<InvarianceAssessment, PARAMS> {

}

/**
 * An invariant that can be enforced via an autofix.
 * Based around a CodeTransform which can be used as a command or an autofix.
 * If the CodeInspection isn't specified,
 * a CodeInspection will be created based on running the transform and seeing if
 * it makes changes.
 */
export interface EnforceableProjectInvariantRegistration<PARAMS = NoParameters>
    extends Partial<InspectionActions<InvarianceAssessment, PARAMS>>,
        CodeTransformRegistration<PARAMS>,
        AutofixRegistration<PARAMS> {

}

/**
 * Result of assessing an invariant against a repo
 */
export interface InvarianceAssessment {

    id: RemoteRepoRef;

    holds: boolean;

    review?: ProjectReview;

    details?: string;
}
