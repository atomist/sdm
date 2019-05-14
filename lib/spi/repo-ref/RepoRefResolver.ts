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

import { RemoteRepoRef } from "@atomist/automation-client";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import {
    CoreRepoFieldsAndChannels,
    OnPushToAnyBranch,
    ScmProvider,
} from "../../typings/types";

/**
 * Resolve a RemoteRepoRef from data in our model
 */
export interface RepoRefResolver {

    /**
     * Obtain RemoteRepoRefs from the given push, correctly
     * resolving provider. There may be more than one virtual RemoteRepoRef
     * @param {OnPushToAnyBranch.Push} push
     * @return {any}
     */
    repoRefFromPush(push: OnPushToAnyBranch.Push): RemoteRepoRef[];

    providerIdFromPush(push: OnPushToAnyBranch.Push): string | null;

    /**
     * get a repoRef from an SdmGoal.
     * @param {SdmGoalEvent} sdmGoal
     * @param {ScmProvider.ScmProvider} provider: No longer needed; the SdmGoalEvent now contains this information
     * @returns {RemoteRepoRef}
     */
    repoRefFromSdmGoal(sdmGoal: SdmGoalEvent, provider?: ScmProvider.ScmProvider): RemoteRepoRef;

    /**
     * Convert GraphQL return to our remote repo ref, instantiating
     * the correct type based on provider
     * @param {CoreRepoFieldsAndChannels.Fragment} repo
     * @param opts options - sha or branch
     * @return {RemoteRepoRef}
     */
    toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment, opts: { sha?: string, branch?: string }): RemoteRepoRef;
}
