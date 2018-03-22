
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

import { sprintf } from "sprintf-js";

export function cacheKeyForSha(id: RemoteRepoRef) {
    return sprintf("%s:%s:%s@%s", id.owner, id.repo, id.sha, id.url);
}
