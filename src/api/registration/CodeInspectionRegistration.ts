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

import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Project } from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Function that can run against a project without mutating it to
 * compute a value.
 */
export type CodeInspection<R, P = any> = (p: Project,
                                          sdmc: CommandListenerInvocation<P>) => Promise<R>;

/**
 * Result of inspecting a single project
 */
export interface InspectionResult<R> {
    repoId: RepoRef;
    result: R;
}

export interface CodeInspectionRegistration<R, PARAMS = NoParameters>
    extends Partial<CommandDetails>,
        CommandRegistration<PARAMS> {

    inspection: CodeInspection<R, PARAMS>;

    /**
     * Allow customization of the repositories that an inspection targets.
     */
    targets?: Maker<FallbackParams>;

    repoFilter?: RepoFilter;

    /**
     * React to computed values from running across one or more projects
     * @param {R[]} results
     * @param ci context
     * @return {Promise<any>}
     */
    react?(results: Array<InspectionResult<R>>, ci: CommandListenerInvocation<PARAMS>): Promise<any>;

}
