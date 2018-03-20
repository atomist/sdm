/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    PushTest,
    pushTest,
    PushTestInvocation,
} from "../PushTest";

const DeployEnablementQuery = `
query DeployEnablementForRepo($owner: [String], $repo: [String]) {
  SDMDeployEnablement(state: ["requested"], owner: $owner, repo: $repo) {
    id
    state
    owner
    repo
    providerId
  }
}`;

/**
 * Is repo enabled for deployment
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const IsDeployEnabled: PushTest = pushTest("Is Deploy Enabled", async (pi: PushTestInvocation) => {
      const enablement = await pi.context.graphClient.executeQuery<any, any>(
          DeployEnablementQuery,
          {
              owner: [ pi.push.repo.owner ],
              repo: [ pi.push.repo.name ],
          },
          { fetchPolicy: "network-only" });
      return enablement
          && enablement.SDMDeployEnablement
          && enablement.SDMDeployEnablement.length === 1
          && enablement.SDMDeployEnablement[0].state === "requested";
});
