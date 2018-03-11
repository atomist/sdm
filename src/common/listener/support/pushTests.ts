import { logger } from "@atomist/automation-client";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { isPublicRepo } from "../../../util/github/ghub";
import { PushTest } from "../GoalSetter";

export const PushToMaster: PushTest = pci => pci.push.branch === "master";

export const ToDefaultBranch: PushTest = p => {
    const flag = p.push.branch === p.push.repo.defaultBranch;
    logger.info("Push to %j on branch %s: ToDefaultBranch=%d", p.id, p.push.branch);
    return flag;
};

/**
 * Is this a push originated by Atomist? Note that we can't look at the committer,
 * as if a user invoked a command handler, their credentials will be used
 * @param {PushTestInvocation} p
 * @return {boolean}
 * @constructor
 */
export const PushFromAtomist: PushTest = p => {
    return p.push.after.message.includes("[atomist]");
};

/**
 * Match on any push
 * @param {PushTestInvocation} p
 * @constructor
 */
export const AnyPush: PushTest = p => true;

/**
 * Match only pushes on a public repo
 * @param {PushTestInvocation} p
 * @return {Promise<boolean>}
 * @constructor
 */
export const ToPublicRepo: PushTest = async p => {
    // Ask GitHub if the repo is public as we do not have this information in our model
    return isGitHubRepoRef(p.id) && (await isPublicRepo(process.env.GITHUB_TOKEN, p.id));
};
