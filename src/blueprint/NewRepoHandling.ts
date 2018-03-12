import { ProjectListener } from "../common/listener/Listener";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";

/**
 * Encapsulate reactions to new repos
 */
export interface NewRepoHandling {

    repoCreationListeners: RepoCreationListener[];

    newRepoWithCodeActions: ProjectListener[];
}
