import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

/**
 * Information about a deployment
 */
export interface Deployment {

    /**
     * The root endpoint, if the deployment has an endpoint
     */
    readonly endpoint?: string;
}

export interface TargetInfo {

    name: string;
    description: string;
}

/**
 * Info to send up for a deployment
 */
export interface AppInfo {

    name: string;
    version: string;

    id: RemoteRepoRef;
}
