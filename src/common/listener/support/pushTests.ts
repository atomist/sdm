import { isPublicRepo } from "../../../util/github/ghub";
import { PushTest } from "../PhaseCreator";

export const PushesToMaster: PushTest = pci => pci.push.branch === "master";

export const PushesToDefaultBranch: PushTest = p => p.push.branch === p.push.repo.defaultBranch;

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
    return isPublicRepo(p.id);
};
