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

import { HandleCommand } from "@atomist/automation-client";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { EditorCommandDetails } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { MachineOrMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { EmptyParameters } from "../command/support/EmptyParameters";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * @deprecated use CodeTransformRegistration
 */
export type EditorRegistration<PARAMS = EmptyParameters> = CodeTransformRegistration<PARAMS>;

/**
 * Type for registering a project transform, which can make changes
 * across projects
 */
export interface CodeTransformRegistration<PARAMS = EmptyParameters> extends Partial<EditorCommandDetails>,
    ProjectOperationRegistration<PARAMS> {

    /**
     * Create the parameters required by this editor.
     * Editors do not require parameters.
     * Empty parameters will be returned by default.
     */
    paramsMaker?: Maker<PARAMS>;

    /**
     * Allow customization of the repositories an editor targets.
     */
    targets?: FallbackParams;

    /**
     * Should this be a custom editor creation function?
     * Typically used to enable a dry run editor: That is,
     * an editor that waits for the build result to determine whether to raise a pull request
     * or issue. Default behavior is to create a branch and a PR.
     */
    transformCommandFactory?: EditorCommandFactory<PARAMS>;

}

/**
 * Function providing the ability to create a custom editor command
 * to change default behavior.
 */
export type EditorCommandFactory<PARAMS> = (
    sdm: MachineOrMachineOptions,
    edd: (params: PARAMS) => AnyProjectEditor,
    name: string,
    paramsMaker?: Maker<PARAMS>,
    details?: Partial<EditorCommandDetails<PARAMS>>,
    targets?: FallbackParams) => HandleCommand<EditOneOrAllParameters>;
