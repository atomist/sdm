import { ProjectListener } from "../handlers/events/delivery/Listener";
import { RepoCreationListener } from "../handlers/events/repo/RepoCreationListener";

export interface NewRepoHandling {

    repoCreationListeners: RepoCreationListener[];

    newRepoWithCodeActions: ProjectListener[];
}
