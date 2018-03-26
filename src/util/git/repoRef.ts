import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnPushToAnyBranch, StatusForExecuteGoal } from "../../typings/types";

import * as _ from "lodash";

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
