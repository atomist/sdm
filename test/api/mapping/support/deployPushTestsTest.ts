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

import { guid } from "@atomist/automation-client/internal/util/string";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../src/api/listener/PushListener";
import { IsDeployEnabled } from "../../../../src/api/mapping/support/deployPushTests";

describe("deployPushTests tests thing", () => {

    describe("IsDeployEnabled", () => {

        it("should be disabled by default and correctly set parameters on the query", async () => {
             const pi = {
                 context: {
                     graphClient: {
                         query(options: { query: string, variables: any, options: any } ) {
                             assert.equal(options.variables.owner, "atomist");
                             assert.equal(options.variables.repo, "github-sdm");
                             return {
                                 SdmDeployEnablement: [],
                             };
                         },
                     },
                 },
                 push: {
                     repo: {
                         owner: "atomist",
                         name: "github-sdm",
                     },
                 },
                 id: GitHubRepoRef.from({owner: "atomist", repo: "github-sdm"}),
             };
             const result = await IsDeployEnabled.mapping(pi as any as PushListenerInvocation);
             assert(!result);
        });

        it("should be enabled correctly via setting", async () => {
            const pi = {
                context: {
                    graphClient: {
                        query(options: { query: string, variables: any, options: any } ) {
                            return {
                                SdmDeployEnablement: [ {
                                    id: guid(),
                                    state: "requested",
                                    owner: "atomist",
                                    repo: "github-sdm",
                                    providerId: "123456",
                                }],
                            };
                        },
                    },
                },
                push: {
                    repo: {
                        owner: "atomist",
                        name: "github-sdm",
                    },
                },
                id: GitHubRepoRef.from({owner: "atomist", repo: "github-sdm"}),

            };
            const result = await IsDeployEnabled.mapping(pi as any as PushListenerInvocation);
            assert(result);
        });

        it("should be disabled correctly via setting", async () => {
            const pi = {
                context: {
                    graphClient: {
                        query(options: { query: string, variables: any, options: any } ) {
                            return {
                                SdmDeployEnablement: [ {
                                    id: guid(),
                                    state: "disabled",
                                    owner: "atomist",
                                    repo: "github-sdm",
                                    providerId: "123456",
                                }],
                            };
                        },
                    },
                },
                push: {
                    repo: {
                        owner: "atomist",
                        name: "github-sdm",
                    },
                },
                id: GitHubRepoRef.from({owner: "atomist", repo: "github-sdm"}),
            };
            const result = await IsDeployEnabled.mapping(pi as any as PushListenerInvocation);
            assert(!result);
        });
    });

});
