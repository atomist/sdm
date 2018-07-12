import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

/**
 * Defines repo targeting for a code inspection or transform
 */
export interface RepoTargets {

    /**
     * Single repo ref we're targeting if there is one
     */
    repoRef: RemoteRepoRef;

    credentials: ProjectOperationCredentials;

    /**
     * Is this repo eligible
     * @param {RemoteRepoRef} id
     * @return {boolean}
     */
    test: RepoFilter;

    /**
     * Throw an exception if invalid
     */
    bindAndValidate?(): void;

}
