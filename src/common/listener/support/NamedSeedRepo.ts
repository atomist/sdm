import { PushTest } from "../GoalSetter";

/**
 * Is this a seed repo, based on the naming convention
 * that such repos have "-seed" in their name
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const NamedSeedRepo: PushTest = pi => pi.id.repo.includes("-seed");
