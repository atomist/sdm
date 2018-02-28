
import { OnPushToAnyBranch } from "../../typings/types";
import { Phases } from "../phases/Phases";
import { ProjectListenerInvocation, SdmListener } from "./Listener";

export interface PhaseCreationInvocation extends ProjectListenerInvocation {

    push: OnPushToAnyBranch.Push;
}

/**
 * A PhaseCreator decided what phases to run depending on repo contents and characteristics
 * of the push.
 * @returns Phases or undefined if it doesn't like the push or
 * understand the repo
 */
export type PhaseCreator = SdmListener<PhaseCreationInvocation, Phases | undefined>;
