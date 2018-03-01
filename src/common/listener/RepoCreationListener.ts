
import * as schema from "../../typings/types";
import { ListenerInvocation, SdmListener } from "./Listener";

export interface RepoCreationInvocation extends ListenerInvocation {

    repo: schema.OnRepoCreation.Repo;
}

/**
 * Respond to the creation of a new repo.
 * Note that it may not have code in it, so you may want to use
 * a ProjectListener! See SoftwareDeliveryMachine.addNewRepoWithCodeActions
 */
export type RepoCreationListener = SdmListener<RepoCreationInvocation>;
