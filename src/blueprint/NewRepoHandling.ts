import { ProjectListener } from "../common/listener/Listener";
import { RepoCreationListener } from "../handlers/events/repo/RepoCreationListener";

export interface NewRepoHandling {

    repoCreationListeners: RepoCreationListener[];

    newRepoWithCodeActions: ProjectListener[];
}
