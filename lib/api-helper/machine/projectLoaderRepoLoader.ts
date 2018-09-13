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

import { HandlerContext } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { RepoLoader } from "@atomist/automation-client/lib/operations/common/repoLoader";
import { ProjectLoader } from "../../spi/project/ProjectLoader";

/**
 * Adapter from newer ProjectLoader to older RepoLoader for use in editors
 * @param pl ProjectLoader
 * @param credentials credentials to use to load projects
 * @param readOnly is the use read only?
 * @return {RepoLoader}
 */
export function projectLoaderRepoLoader(pl: ProjectLoader,
                                        credentials: ProjectOperationCredentials,
                                        readOnly: boolean,
                                        context?: HandlerContext): RepoLoader {
    return async id => {
        let project;
        await pl.doWithProject({ id: id as RemoteRepoRef, credentials, readOnly, context },
            async p => {
                project = p;
            });
        return project;
    };
}
