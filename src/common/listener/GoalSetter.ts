import { OnPushToAnyBranch } from "../../typings/types";
import { Goals } from "../goals/Goal";
import { ProjectListenerInvocation } from "./Listener";

/**
 * Return true if we like this push and think we should attempt
 * to determine phases for it.
 */
export type PushTest = (p: PushTestInvocation) => boolean | Promise<boolean>;

export interface PushTestInvocation extends ProjectListenerInvocation {

    readonly push: OnPushToAnyBranch.Push;
}

/**
 * A GoalSetter decides what phases to run depending on repo contents and characteristics
 * of the push. It is fundamental to determining the flow after the push:
 * for example: do we want to run a code scan?; do we want to build?; do
 * we want to deploy?
 * @returns Goals or undefined if it doesn't like the push or
 * understand the repo
 */
export interface GoalSetter {

    /**
     * Test the push as to whether we should even think about creating phases for it.
     * If we return false here, our createPhases method will never be
     * called for this push
     */
    readonly guard?: PushTest;

    /**
     * Determine the phases that apply to this PushTestInvocation,
     * or return undefined if this GoalSetter doesn't know what to do with it.
     * The latter is not an error.
     * @param {PushTestInvocation} pci
     * @return {Promise<Goals>}
     */
    createPhases(pci: PushTestInvocation): Promise<Goals | undefined>;

}
