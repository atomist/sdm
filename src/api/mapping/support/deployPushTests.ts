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
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import {
    QueryNoCacheOptions,
} from "@atomist/automation-client/spi/graph/GraphClient";
import {
    pushTest,
    PushTest,
} from "../PushTest";

// TODO once the ingester is defined elsewhere move this into a file and generate types
const DeployEnablementQuery = `
query DeployEnablementForRepo($owner: [String], $repo: [String]) {
  SdmDeployEnablement(state: ["requested"], owner: $owner, repo: $repo) {
    id
    state
    owner
    repo
    providerId
  }
}`;

/**
 * Is repo enabled for deployment
 * @param {PushListenerInvocation} pi
 */
export const IsDeployEnabled: PushTest = pushTest("Is Deploy Enabled", isDeployEnabled);

export async function isDeployEnabled(parameters: { context: HandlerContext, id: RepoRef }) {
    const {context, id} = parameters;
    const enablement = await context.graphClient.query<any, any>({
        query: DeployEnablementQuery,
        variables: {
            owner: [id.owner],
            repo: [id.repo],
        },
        options: QueryNoCacheOptions,
    });
    return enablement
        && enablement.SdmDeployEnablement
        && enablement.SdmDeployEnablement.length === 1
        && enablement.SdmDeployEnablement[0].state === "requested";
}
