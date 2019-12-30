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

import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { ParametersInvocation } from "../listener/ParametersInvocation";
import { CodeInspection } from "./CodeInspectionRegistration";
import { PushImpactResponse } from "./PushImpactListenerRegistration";
import { PushSelector } from "./PushRegistration";

/**
 * Register an automatic inspection.
 */
export interface AutoInspectRegistration<R, PARAMS = NoParameters> extends PushSelector {

    /**
     * Inspection function to run on each project
     */
    inspection: CodeInspection<R, PARAMS>;

    /**
     * Parameters used for all inspections
     */
    parametersInstance?: PARAMS;

    /**
     * Invoked after each inspection result, if provided.
     * A void return means keep processing this push. Return a
     * PushImpactResponse to demand approval or fail goals.
     * @param {R} result
     * @param {ParametersInvocation<PARAMS>} ci
     * @return {Promise<void>}
     */
    onInspectionResult?(result: R, ci: ParametersInvocation<PARAMS>): Promise<PushImpactResponse | void>;
}
