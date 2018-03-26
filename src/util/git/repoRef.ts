import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnPushToAnyBranch, StatusForExecuteGoal } from "../../typings/types";

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
