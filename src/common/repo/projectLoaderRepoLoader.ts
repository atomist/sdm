import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { ProjectLoader } from "./ProjectLoader";

/**
 * Adapter from newer ProjectLoader to older RepoLoader for use in editors
 * @param pl ProjectLoader
 * @param credentials credentials to use to load projects
 * @return {RepoLoader}
 */
export function projectLoaderRepoLoader(pl: ProjectLoader, credentials: ProjectOperationCredentials): RepoLoader {
    return async id => {
        let project;
        await pl.doWithProject({id: id as RemoteRepoRef, credentials, readOnly: false}, async p => {
            project = p;
        });
        return project;
    };
}
