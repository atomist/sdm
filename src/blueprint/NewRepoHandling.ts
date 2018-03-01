import { ProjectListener } from "../common/listener/Listener";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";

export interface NewRepoHandling {

    repoCreationListeners: RepoCreationListener[];

    newRepoWithCodeActions: ProjectListener[];
}
