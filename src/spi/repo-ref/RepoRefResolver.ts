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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SdmGoal } from "../../api/goal/SdmGoal";
import { CoreRepoFieldsAndChannels, OnPushToAnyBranch, ScmProvider, StatusForExecuteGoal } from "../../typings/types";

/**
 * Resolve a RemoteRepoRef from data in our model
 */
export interface RepoRefResolver {

    /**
     * Obtain a RemoteRepoRef from the given push, correctly
     * resolving provider.
     * @param {OnPushToAnyBranch.Push} push
     * @return {any}
     */
    repoRefFromPush(push: OnPushToAnyBranch.Push): RemoteRepoRef;

    providerIdFromPush(push: OnPushToAnyBranch.Push): string | null;

    providerIdFromStatus(status: StatusForExecuteGoal.Fragment): string | null;

    repoRefFromSdmGoal(sdmGoal: SdmGoal, provider: ScmProvider.ScmProvider): RemoteRepoRef;

    /**
     * Convert GraphQL return to our remote repo ref, instantiating
     * the correct type based on provider
     * @param {CoreRepoFieldsAndChannels.Fragment} repo
     * @param opts options - sha or branch
     * @return {RemoteRepoRef}
     */
    toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment, opts: { sha?: string, branch?: string }): RemoteRepoRef;
}
