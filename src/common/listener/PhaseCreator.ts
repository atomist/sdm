import { OnPushToAnyBranch } from "../../typings/types";
import { Phases } from "../phases/Phases";
import { ProjectListenerInvocation } from "./Listener";

/**
 * Return true if we like this push and think we should attempt
 * to determine phases for it.
 */
export type PushTest = (p: PhaseCreationInvocation) => boolean | Promise<boolean>;

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
 * All of these guards vote for these phases
 * @param {PushTest} guards
 * @return {PushTest}
 */
export function allGuardsVoteFor(...guards: PushTest[]): PushTest {
    return async pci => {
        const guardResults: boolean[] = await Promise.all(guards.map(g => g(pci)));
        return !guardResults.some(r => !r);
    };
}

export interface PhaseCreationInvocation extends ProjectListenerInvocation {

    push: OnPushToAnyBranch.Push;
}

/**
 * A PhaseCreator decided what phases to run depending on repo contents and characteristics
 * of the push. It is fundamental to determining the flow after the push:
 * for example: do we want to run a code scan?; do we want to build?; do
 * we want to deploy?
 * @returns Phases or undefined if it doesn't like the push or
 * understand the repo
 */
export interface PhaseCreator {

    /**
     * Test the push as to whether we should even look inside it.
     * If we return false here, our createPhases method will never be
     * called for this push
     */
    guard?: PushTest;

    /**
     * All the phases we might return. Used for cleanup.
     */
    possiblePhases: Phases[];

    /**
     * Determine the phases that apply to this PhaseCreationInvocation,
     * or return undefined if this PhaseCreator doesn't know what to do with it.
     * The latter is not an error.
     * @param {PhaseCreationInvocation} pci
     * @return {Promise<Phases>}
     */
    createPhases(pci: PhaseCreationInvocation): Promise<Phases | undefined>;
}
