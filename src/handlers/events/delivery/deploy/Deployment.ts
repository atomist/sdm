import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

export interface Deployment {

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
