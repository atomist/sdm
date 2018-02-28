import { OnPushToAnyBranch } from "../../typings/types";
import { Phases } from "../phases/Phases";
import { ProjectListenerInvocation } from "./Listener";

/**
 * Return true if we like this push
 */
export type PushTest = (p: PhaseCreationInvocation) => boolean | Promise<boolean>;

export const PushesToMaster: PushTest = pci => pci.push.branch === "master";

// TODO should do this but it doesn't work
// export const PushesToMaster: PushTest = p => p.push.branch === p.repo.defaultBranch;

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
 * of the push.
 * @returns Phases or undefined if it doesn't like the push or
 * understand the repo
 */
export interface PhaseCreator {

    guard?: PushTest;

    /**
     * All the phases we might return
     */
    possiblePhases: Phases[];

    createPhases(pci: PhaseCreationInvocation): Promise<Phases | undefined>;
}
