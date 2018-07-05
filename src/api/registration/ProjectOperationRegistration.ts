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

import { AnyProjectEditor, SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainTransforms } from "./CodeTransformRegistration";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Function that can transform a project
 */
export type CodeTransform<P = any> = SimpleProjectEditor<P>;

export type CodeTransformRegisterable<P = any> = AnyProjectEditor<P>;

/**
 * One or many CodeTransforms
 */
export type CodeTransformOrTransforms<PARAMS> = CodeTransformRegisterable<PARAMS> | Array<CodeTransformRegisterable<PARAMS>>;

export function toCodeTransformRegisterable<PARAMS>(ctot: CodeTransformOrTransforms<PARAMS>): CodeTransformRegisterable<PARAMS> {
    if (Array.isArray(ctot)) {
        return chainTransforms(...ctot);
    } else {
        return ctot as CodeTransform<PARAMS>;
    }
}

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects. Either an editor or a createEditor
 * function must be provided.
 */
export interface ProjectOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Function to transform the project
     */
    transform?: CodeTransformOrTransforms<PARAMS>;

    /**
     * Create the editor function that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createTransform?: (params: PARAMS) => CodeTransform<PARAMS>;

    /**
     * @deprecated use transform
     */
    editor?: CodeTransform<PARAMS>;

    /**
     * @deprecated use createTransform
     */
    createEditor?: (params: PARAMS) => CodeTransform<PARAMS>;
}
