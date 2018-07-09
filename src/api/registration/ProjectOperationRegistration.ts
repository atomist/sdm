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

import { CodeTransform, CodeTransformOrTransforms } from "./CodeTransform";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects. Supply a transform function.
 */
export interface ProjectOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Function to transform the project
     */
    transform?: CodeTransformOrTransforms<PARAMS>;

    /**
     * @deprecated use transform
     * Create the editor function that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createTransform?: (params: PARAMS) => CodeTransform<PARAMS>;

}
