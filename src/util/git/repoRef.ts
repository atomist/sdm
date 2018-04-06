/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnPushToAnyBranch, ScmProvider, StatusForExecuteGoal } from "../../typings/types";

import * as _ from "lodash";
import { SdmGoal } from "../../ingesters/sdmGoalIngester";

export function repoRefFromPush(push: OnPushToAnyBranch.Push) {
    return GitHubRepoRef.from({
        owner: push.repo.owner,
        repo: push.repo.name,
        sha: push.after.sha,
        rawApiBase: push.repo.org.provider.apiUrl,
        branch: push.branch,
    });
}

export function providerIdFromPush(push: OnPushToAnyBranch.Push) {
    return push.repo.org.provider.providerId;
}

export function providerIdFromStatus(status: StatusForExecuteGoal.Fragment) {
    return status.commit.repo.org.provider.providerId;
}

export function repoRefFromStatus(status: StatusForExecuteGoal.Fragment) {
    return GitHubRepoRef.from({
        owner: status.commit.repo.owner,
        repo: status.commit.repo.name,
        sha: status.commit.sha,
        rawApiBase: status.commit.repo.org.provider.apiUrl,
        branch: _.get(status, "commit.pushes[0].branch"),
    });
}

export function repoRefFromSdmGoal(sdmGoal: SdmGoal, provider: ScmProvider.ScmProvider): GitHubRepoRef {
    return GitHubRepoRef.from({
        owner: sdmGoal.repo.owner,
        repo: sdmGoal.repo.name,
        sha: sdmGoal.sha,
        branch: sdmGoal.branch,
        rawApiBase: provider.apiUrl,
    });
}
