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

import { SelectiveCodeActionOptions, } from "./PushImpactListenerRegistration";
import { CodeInspection } from "./CodeInspectionRegistration";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { PushSelector } from "./PushRegistration";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { ParametersInvocation } from "../listener/ParametersInvocation";

export type AutoInspectRegistrationOptions = SelectiveCodeActionOptions;

/**
 * Register an automatic inspection.
 */
export interface AutoInspectRegistration<R, PARAMS = NoParameters> extends PushSelector {

    options?: AutoInspectRegistrationOptions;

    /**
     * Inspection function to run on each project
     */
    inspection: CodeInspection<R, PARAMS>;

    /**
     * Parameters used for all inspections
     */
    parametersInstance?: PARAMS;

    /**
     * Invoked after each inspection result, if provided
     * @param {R} result
     * @param {CommandListenerInvocation<PARAMS>} ci
     * @return {Promise<any>}
     */
    onInspectionResult?(result: R, ci: ParametersInvocation<PARAMS>): Promise<any>;
}
