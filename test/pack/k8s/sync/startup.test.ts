/*
 * Copyright © 2020 Atomist, Inc.
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

import * as cluster from "cluster";
import * as assert from "power-assert";
import * as createJob from "../../../../lib/api-helper/misc/job/createJob";
import * as modes from "../../../../lib/core/machine/modes";
import * as repo from "../../../../lib/pack/k8s/sync/repo";
import { syncRepoStartupListener } from "../../../../lib/pack/k8s/sync/startup";
import { KubernetesSync } from "../../../../lib/pack/k8s/sync/sync";

describe("core/pack/k8s/sync/startup", () => {

    describe("syncRepoStartupListener", () => {

        let originalIsInLocalMode: any;
        let originalQueryForScmProvider: any;
        let originalIsMaster: any;
        let originalCreateJob: any;
        let isInLocalModeCalled = false;
        let queryForScmProviderCalled = false;
        let createJobCalled = false;
        let createJobDetails: any;
        before(() => {
            originalIsInLocalMode = Object.getOwnPropertyDescriptor(modes, "isInLocalMode");
            originalQueryForScmProvider = Object.getOwnPropertyDescriptor(repo, "queryForScmProvider");
            originalIsMaster = Object.getOwnPropertyDescriptor(cluster, "isMaster");
            originalCreateJob = Object.getOwnPropertyDescriptor(createJob, "createJob");
            Object.defineProperty(createJob, "createJob", {
                value: async (d: any[]) => {
                    createJobCalled = true;
                    createJobDetails = d;
                },
            });
        });
        after(() => {
            Object.defineProperty(modes, "isInLocalMode", originalIsInLocalMode);
            Object.defineProperty(repo, "queryForScmProvider", originalQueryForScmProvider);
            Object.defineProperty(cluster, "isMaster", originalIsMaster);
            Object.defineProperty(createJob, "createJob", originalCreateJob);
        });

        interface SetupMocks {
            localMode: boolean;
            scmProvider: boolean;
            master: boolean;
        }
        function setupMocks(setup: SetupMocks): void {
            isInLocalModeCalled = false;
            queryForScmProviderCalled = false;
            createJobCalled = false;
            createJobDetails = undefined;
            Object.defineProperty(modes, "isInLocalMode", {
                value: () => {
                    isInLocalModeCalled = true;
                    return setup.localMode;
                },
            });
            Object.defineProperty(repo, "queryForScmProvider", {
                value: async () => {
                    queryForScmProviderCalled = true;
                    return setup.scmProvider;
                },
            });
            Object.defineProperty(cluster, "isMaster", {
                value: setup.master,
            });
        }

        it("should return fast if in local mode", async () => {
            setupMocks({
                localMode: true,
                scmProvider: true,
                master: true,
            });
            const c: any = undefined;
            await syncRepoStartupListener(c);
            assert(isInLocalModeCalled);
            assert(!queryForScmProviderCalled);
            assert(!createJobCalled);
        });

        it("should return if no sync repo options", async () => {
            setupMocks({
                localMode: false,
                scmProvider: true,
                master: true,
            });
            const ss: any[] = [
                {},
                { k8s: {} },
                { k8s: { options: {} } },
                { k8s: { options: { sync: {} } } },
                { k8s: { options: { sync: { repo: {} } } } },
                { k8s: { options: { sync: { repo: { owner: "slim" } } } } },
                { k8s: { options: { sync: { repo: { repo: "slender" } } } } },
            ];
            for (const s of ss) {
                const c: any = {
                    sdm: {
                        configuration: {
                            sdm: s,
                        },
                    },
                };
                await syncRepoStartupListener(c);
                assert(isInLocalModeCalled);
                assert(!queryForScmProviderCalled);
                assert(!createJobCalled);
            }
        });

        it("should not check master if no provider", async () => {
            setupMocks({
                localMode: false,
                scmProvider: false,
                master: true,
            });
            const c: any = {
                sdm: {
                    configuration: {
                        sdm: {
                            k8s: {
                                options: {
                                    sync: {
                                        repo: {
                                            owner: "slim",
                                            repo: "slender",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };
            await syncRepoStartupListener(c);
            assert(isInLocalModeCalled);
            assert(queryForScmProviderCalled);
            assert(!createJobCalled);
        });

        it("should not not call sdmRepoSync if not master", async () => {
            setupMocks({
                localMode: false,
                scmProvider: true,
                master: false,
            });
            const c: any = {
                sdm: {
                    configuration: {
                        sdm: {
                            k8s: {
                                options: {
                                    sync: {
                                        repo: {
                                            owner: "slim",
                                            repo: "slender",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };
            await syncRepoStartupListener(c);
            assert(isInLocalModeCalled);
            assert(queryForScmProviderCalled);
            assert(!createJobCalled);
        });

        it("should not not call sdmRepoSync if isolated goal", async () => {
            setupMocks({
                localMode: false,
                scmProvider: true,
                master: true,
            });
            const c: any = {
                sdm: {
                    configuration: {
                        sdm: {
                            k8s: {
                                options: {
                                    sync: {
                                        repo: {
                                            owner: "slim",
                                            repo: "slender",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };
            process.env.ATOMIST_ISOLATED_GOAL = "true";
            await syncRepoStartupListener(c);
            delete process.env.ATOMIST_ISOLATED_GOAL;
            assert(isInLocalModeCalled);
            assert(queryForScmProviderCalled);
            assert(!createJobCalled);
        });

        it("should call sdmRepoSync", async () => {
            setupMocks({
                localMode: false,
                scmProvider: true,
                master: true,
            });
            const c: any = {
                sdm: {
                    configuration: {
                        graphql: {
                            client: {
                                factory: {
                                    create: () => ({}),
                                },
                            },
                        },
                        sdm: {
                            k8s: {
                                options: {
                                    sync: {
                                        repo: {
                                            owner: "slim",
                                            repo: "slender",
                                        },
                                    },
                                },
                            },
                        },
                        workspaceIds: ["A5L1M5L3ND"],
                    },
                },
            };
            await syncRepoStartupListener(c);
            assert(isInLocalModeCalled);
            assert(queryForScmProviderCalled);
            assert(createJobCalled);
            const e = { command: KubernetesSync, parameters: [{}] };
            assert.deepStrictEqual(createJobDetails, e);
        });

    });

});
