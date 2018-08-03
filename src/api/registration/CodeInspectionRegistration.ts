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

import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Project } from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { ProjectsOperationRegistration } from "./ProjectsOperationRegistration";

/**
 * Function that can run against a project without mutating it to
 * compute a value.
 */
export type CodeInspection<R, P = NoParameters> = (p: Project,
                                                   cli: CommandListenerInvocation<P>) => Promise<R>;

/**
 * Result of inspecting a single project
 */
export interface InspectionResult<R> {

    repoId: RepoRef;

    /**
     * Inspection result can be undefined if a repo was returned by an all repo query but the
     * inspection was not run on that repo because it did not match the project predicate specified in the registration.
     */
    result: R | undefined;
}

/**
 * Register a CodeInspection that can run against any number of projects.
 * Include an optional react method that can react to review results.
 */
export interface CodeInspectionRegistration<R, PARAMS = NoParameters>
    extends ProjectsOperationRegistration<PARAMS> {

    inspection: CodeInspection<R, PARAMS>;

    /**
     * React to computed values from running across one or more projects.
     * If not provided, a default will be used: the results will be summarized to ci.addressChannels.
     * @param {R[]} results
     * @param ci context
     * @return {Promise<any>}
     */
    react?(results: Array<InspectionResult<R>>, ci: CommandListenerInvocation<PARAMS>): Promise<any>;

}
