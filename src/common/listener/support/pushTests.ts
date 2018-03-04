import { logger } from "@atomist/automation-client";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { isPublicRepo } from "../../../util/github/ghub";
import { PushTest } from "../PhaseCreator";

export const PushesToMaster: PushTest = pci => pci.push.branch === "master";

export const PushesToDefaultBranch: PushTest = p => {
    const flag = p.push.branch === p.push.repo.defaultBranch;
    logger.info("Push to %j on branch %s: PushesToDefaultBranch=%d", p.id, p.push.branch);
    return flag;
};

/**
 * Match on any push
 * @param {PhaseCreationInvocation} p
 * @constructor
 */
export const AnyPush: PushTest = p => true;

/**
 * Match only pushes on a public repo
 * @param {PhaseCreationInvocation} p
 * @return {Promise<boolean>}
 * @constructor
 */
export const PushToPublicRepo: PushTest = async p => {
    // Ask GitHub if the repo is public as we do not have this information in our model
    return isGitHubRepoRef(p.id) && isPublicRepo(p.id);
};
