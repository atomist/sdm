import { PushTest } from "../PhaseCreator";
import { isPublicRepo } from "../../../util/github/ghub";

export const PushesToMaster: PushTest = pci => pci.push.branch === "master";

// TODO should do this but it doesn't work
// export const PushesToMaster: PushTest = p => p.push.branch === p.repo.defaultBranch;

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
