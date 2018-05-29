/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandlerContext } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../api/context/addressChannels";
import { LogInterpretation } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";

export interface PushThatTriggersBuild {
    branch: string;
    defaultBranch: string;

    name: string;
    owner: string;
    providerId: string;

    sha: string;
}

/**
 * Responsible for initiating a build and storing an artifact.
 * Wherever the build runs, it is responsible for emitting Atomist build events.
 */
export interface Builder extends LogInterpretation {

    name: string;

    initiateBuild(creds: ProjectOperationCredentials,
                  id: RemoteRepoRef,
                  ac: AddressChannels,
                  push: PushThatTriggersBuild,
                  log: ProgressLog,
                  context: HandlerContext): Promise<any>;
}
