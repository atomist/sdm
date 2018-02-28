
import { ListenerInvocation, SdmListener } from "../../../common/listener/Listener";
import * as schema from "../../../typings/types";

export interface RepoCreationInvocation extends ListenerInvocation {

    repo: schema.OnRepoCreation.Repo;
}

export type RepoCreationListener = SdmListener<RepoCreationInvocation>;
