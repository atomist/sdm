import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../common/slack/addressChannels";

export interface PushThatTriggersBuild {
    branch: string;
}

/**
 * Responsible for initiating a build. Wherever the build runs,
 * it is responsible for emitting Atomist build events.
 */
export interface Builder {

    initiateBuild(creds: ProjectOperationCredentials,
                  id: RemoteRepoRef,
                  ac: AddressChannels,
                  team: string,
                  push: PushThatTriggersBuild): Promise<any>;

}
