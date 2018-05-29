import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { PushTest, pushTest } from "../../api/mapping/PushTest";
import { isPublicRepo } from "../../util/github/ghub";

/**
 * Match only pushes on a public repo
 * @param {PushListenerInvocation} p
 * @return {Promise<boolean>}
 * @constructor
 */
export const ToPublicRepo: PushTest = pushTest("To public repo", async p =>
    // Ask GitHub if the repo is public as we do not have this information in our model
    isGitHubRepoRef(p.id) && isPublicRepo(p.credentials, p.id),
);
