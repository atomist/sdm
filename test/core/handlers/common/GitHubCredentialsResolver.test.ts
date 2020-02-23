/*
 * Copyright © 2019 Atomist, Inc.
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

import { Secrets } from "@atomist/automation-client/lib/decorators";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { TokenCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import * as assert from "power-assert";
import { GitHubCredentialsResolver } from "../../../../lib/core/handlers/common/GitHubCredentialsResolver";

describe("GitHubCredentialsResolver", () => {

    beforeEach(() => {
        delete (global as any).__runningAutomationClient;
    });

    afterEach(() => {
        delete (global as any).__runningAutomationClient;
    });

    describe("eventHandlerCredentials", () => {

        it("should resolve from configuration", async () => {
            const sr = new GitHubCredentialsResolver();

            (global as any).__runningAutomationClient = {
                configuration: {
                    sdm: {
                        github: {
                            token: "123456",
                        },
                    },
                },
            };

            const creds = await sr.eventHandlerCredentials({
                    trigger: {
                        secrets: [{ uri: Secrets.OrgToken, value: "654321" }],
                    },
                    graphClient: {
                        query: () => {
                            assert.fail();
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "123456");
        });

        it("should resolve from incoming event", async () => {
            const sr = new GitHubCredentialsResolver();

            const creds = await sr.eventHandlerCredentials({
                    trigger: {
                        secrets: [{ uri: Secrets.OrgToken, value: "654321" }],
                    },
                    graphClient: {
                        query: () => {
                            assert.fail();
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "654321");
        });

        it("should resolve from scm provider", async () => {
            const sr = new GitHubCredentialsResolver();

            const creds = await sr.eventHandlerCredentials({
                    trigger: {},
                    graphClient: {
                        query: () => {
                            return {
                                SCMProvider: [{
                                    credential: {
                                        secret: "654321",
                                    },
                                }],
                            };
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "654321");
        });

        it("should throw error if no token", async () => {
            const sr = new GitHubCredentialsResolver();

            try {
                await sr.eventHandlerCredentials(
                    {
                        graphClient: {
                            query: () => {
                                return { SCMProvider: [] };
                            },
                        },
                    } as any,
                    GitHubRepoRef.from({
                        owner: "atomist",
                        repo: "sdm",
                    }));
            } catch (e) {
                assert(e.message.includes("No GitHub token available!"));
            }

        });

    });

    describe("commandHandlerCredentials", () => {

        it("should resolve from configuration", async () => {
            const sr = new GitHubCredentialsResolver();

            (global as any).__runningAutomationClient = {
                configuration: {
                    sdm: {
                        github: {
                            token: "123456",
                        },
                    },
                },
            };

            const creds = await sr.commandHandlerCredentials({
                    trigger: {},
                    graphClient: {
                        query: () => {
                            assert.fail();
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "123456");
        });

        it("should resolve from incoming command", async () => {
            const sr = new GitHubCredentialsResolver();

            (global as any).__runningAutomationClient = {
                configuration: {
                    sdm: {
                        github: {
                            token: "123456",
                        },
                    },
                },
            };

            const creds = await sr.commandHandlerCredentials({
                    trigger: {
                        secrets: [{ uri: Secrets.OrgToken, value: "654321" }],
                    },
                    graphClient: {
                        query: () => {
                            assert.fail();
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "654321");
        });

        it("should resolve from scm provider", async () => {
            const sr = new GitHubCredentialsResolver();

            const creds = await sr.commandHandlerCredentials({
                    trigger: {},
                    graphClient: {
                        query: () => {
                            return {
                                SCMProvider: [{
                                    credential: {
                                        secret: "654321",
                                    },
                                }],
                            };
                        },
                    },
                } as any,
                GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }));

            assert.strictEqual((creds as TokenCredentials).token, "654321");
        });

        it("should throw error if no token", async () => {
            const sr = new GitHubCredentialsResolver();

            try {
                await sr.commandHandlerCredentials(
                    {
                        graphClient: {
                            query: () => {
                                return { SCMProvider: [] };
                            },
                        },
                    } as any,
                    GitHubRepoRef.from({
                        owner: "atomist",
                        repo: "sdm",
                    }));
            } catch (e) {
                assert(e.message.includes("No GitHub token available!"));
            }

        });

    });

})
;
