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

import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ValidationError } from "@atomist/automation-client/SmartParameters";

export interface ValidationError {
    message: string;
}

export type ValidationResult = void | ValidationError;

/**
 * Defines repo targeting for a code inspection or transform
 */
export interface RepoTargets {

    /**
     * Single repo ref we're targeting if there is one
     */
    repoRef: RemoteRepoRef;

    credentials: ProjectOperationCredentials;

    /**
     * Is this repo eligible
     * @param {RemoteRepoRef} id
     * @return {boolean}
     */
    test: RepoFilter;

    /**
     * Optional method to populate and validate
     */
    bindAndValidate(): ValidationResult;

}

export function isValidationError(vr: ValidationResult): vr is ValidationError {
    const maybe = vr as ValidationError;
    return !!maybe.message;
}
