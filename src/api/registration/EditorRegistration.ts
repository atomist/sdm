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
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { EmptyParameters } from "../command/support/EmptyParameters";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * Type for registering a project edit, which can encapsulate changes
 * to projects
 */
export interface EditorRegistration<PARAMS = EmptyParameters> extends Partial<EditorCommandDetails>,
    ProjectOperationRegistration<PARAMS> {

    /**
     * Create the parameters required by this editor.
     * Empty parameters will be returned by default.
     */
    paramsMaker?: Maker<PARAMS>;

    /**
     * Allow customization of editor targeting
     */
    targets?: FallbackParams;

    /**
     * Should this be a dry run editor: That is,
     * should it wait for the build result to determine whether to raise a pull request
     * or issue. Default is no.
     */
    dryRun?: boolean;

}
