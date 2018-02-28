
import * as schema from "../../../typings/types";
import { ListenerInvocation, SdmListener } from "../delivery/Listener";

export interface RepoCreationInvocation extends ListenerInvocation {

    repo: schema.OnRepoCreation.Repo;
}

export type RepoCreationListener = SdmListener<RepoCreationInvocation>;
