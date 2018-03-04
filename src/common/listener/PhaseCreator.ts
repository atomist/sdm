import { OnPushToAnyBranch } from "../../typings/types";
import { Phases } from "../phases/Phases";
import { ProjectListenerInvocation } from "./Listener";

/**
 * Return true if we like this push and think we should attempt
 * to determine phases for it.
 */
export type PushTest = (p: PhaseCreationInvocation) => boolean | Promise<boolean>;

export interface PhaseCreationInvocation extends ProjectListenerInvocation {

    readonly push: OnPushToAnyBranch.Push;
}

/**
 * A PhaseCreator decides what phases to run depending on repo contents and characteristics
 * of the push. It is fundamental to determining the flow after the push:
 * for example: do we want to run a code scan?; do we want to build?; do
 * we want to deploy?
 * @returns Phases or undefined if it doesn't like the push or
 * understand the repo
 */
export interface PhaseCreator {

    /**
     * Test the push as to whether we should even think about creating phases for it.
     * If we return false here, our createPhases method will never be
     * called for this push
     */
    readonly guard?: PushTest;

    /**
     * Determine the phases that apply to this PhaseCreationInvocation,
     * or return undefined if this PhaseCreator doesn't know what to do with it.
     * The latter is not an error.
     * @param {PhaseCreationInvocation} pci
     * @return {Promise<Phases>}
     */
    createPhases(pci: PhaseCreationInvocation): Promise<Phases | undefined>;

}
