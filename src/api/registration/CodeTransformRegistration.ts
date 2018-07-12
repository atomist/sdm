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

import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { EditorCommandDetails } from "@atomist/automation-client/operations/edit/editorToCommand";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { RepoTargets } from "../machine/RepoTargets";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * Type for registering a project transform, which can make changes
 * across projects
 */
export interface CodeTransformRegistration<PARAMS = NoParameters>
    extends Partial<EditorCommandDetails>,
        ProjectOperationRegistration<PARAMS> {

    /**
     * Allow customization of the repositories a transform targets.
     */
    targets?: Maker<RepoTargets>;

    /**
     * Additionally, programmatically target repositories to transform
     */
    repoFilter?: RepoFilter;

    /**
     * React to results from running edits across one or more projects
     * @param results
     * @param ci context
     * @return {Promise<any>}
     */
    react?(results: EditResult[], ci: CommandListenerInvocation<PARAMS>): Promise<any>;

}

/**
 * Signature of a decorator function that can add additional behavior
 * to a CodeTransformRegistration.
 */
export type CodeTransformRegistrationDecorator<PARAMS> =
    (ctr: CodeTransformRegistration<PARAMS>) => CodeTransformRegistration<PARAMS>;
