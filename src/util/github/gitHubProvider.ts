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
import { ScmProvider } from "../../typings/types";

export const GitHubDotComProviderId = "zjlmxjzwhurspem";

export async function fetchProvider(context: HandlerContext, providerId: string): Promise<ScmProvider.ScmProvider> {
    const results = await context.graphClient.query<ScmProvider.Query, ScmProvider.Variables>(
        {name: "SCMProvider", variables: {providerId}});

    if (!results || !results.SCMProvider || results.SCMProvider.length === 0) {
        throw new Error("Provider not found: " + providerId);
    }
    return results.SCMProvider[0];

}
