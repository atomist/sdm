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

import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { EditorCommandDetails } from "@atomist/automation-client/operations/edit/editorToCommand";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

export { chainEditors as chainTransforms } from "@atomist/automation-client/operations/edit/projectEditorOps";

/**
 * @deprecated use CodeTransformRegistration
 */
export type EditorRegistration<PARAMS = NoParameters> = CodeTransformRegistration<PARAMS>;

/**
 * Type for registering a project transform, which can make changes
 * across projects
 */
export interface CodeTransformRegistration<PARAMS = NoParameters> extends Partial<EditorCommandDetails>,
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

}

/**
 * Signature of a decorator function that can add additional behavior
 * to a CodeTransformRegistration.
 */
export type CodeTransformRegistrationDecorator<PARAMS> =
    (ctr: CodeTransformRegistration<PARAMS>) => CodeTransformRegistration<PARAMS>;
