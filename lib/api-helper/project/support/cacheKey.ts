/*
 * Copyright © 2019 Atomist, Inc.
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

import { sprintf } from "sprintf-js";
import { ProjectLoadingParameters } from "../../../spi/project/ProjectLoader";

/**
 * Compute a cache key from the given ProjectLoadingParameters.
 *
 * In this context undefined and false are functionally equivalent, so
 * undefined values are coerced to false.
 *
 * @param {RemoteRepoRef} id
 * @return {any}
 */
export function cacheKey(params: ProjectLoadingParameters): string {
    return sprintf("%s:%s:%s:%s:%s:%s:%s:%s:%s@%s",
        params.id.owner,
        params.id.repo,
        params.id.branch,
        params.id.sha,
        params.cloneOptions?.keep || false,
        params.cloneOptions?.alwaysDeep || false,
        params.cloneOptions?.noSingleBranch || false,
        params.cloneOptions?.depth || 1,
        params.cloneOptions?.detachHead || false,
        params.id.url);
}
