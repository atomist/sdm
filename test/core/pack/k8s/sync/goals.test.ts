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

import { ProviderType as ScmProviderType } from "@atomist/automation-client/lib/operations/common/RepoId";
import * as _ from "lodash";
import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../../lib/api/listener/PushListener";
import { SoftwareDeliveryMachine } from "../../../../../lib/api/machine/SoftwareDeliveryMachine";
import { isSyncRepoCommit } from "../../../../../lib/core/pack/k8s/sync/goals";

describe("pack/k8s/sync/goals", () => {

    describe("isSyncRepoCommit", () => {

        it("should return undefined if no sync options", () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {},
                        },
                    },
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t === undefined);
        });

        it("should return test and match", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    name: "@atomist/k8s-sdm_i-started-something",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: {
                                        token: "j04nnym@44",
                                    },
                                    repo: {
                                        branch: "a-rush-and-a-push",
                                        owner: "TheSmiths",
                                        providerType: ScmProviderType.github_com,
                                        repo: "strangeways",
                                        setUserConfig: async () => { },
                                        url: "https://github.com/TheSmiths/strangeways",
                                    },
                                },
                            },
                        },
                    },
                    workspaceIds: ["AM0441SS3Y"],
                },
            } as any;
            const p: PushListenerInvocation = {
                id: {
                    branch: "a-rush-and-a-push",
                    owner: "TheSmiths",
                    providerType: ScmProviderType.github_com,
                    repo: "strangeways",
                    sha: "bb94dbf2a40b3754f2e62797c80923b938f60fb3",
                },
                push: {
                    commits: [
                        { message: "Stop me if you think you've heard this one before" },
                    ],
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t, "no push test was returned");
            const r = await t.mapping(p);
            assert(r === true, "push test result was false");
        });

        it("should work with SyncRepoRef that becomes RemoteRepoRef", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    name: "@atomist/k8s-sdm_i-started-something",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: {
                                        token: "j04nnym@44",
                                    },
                                    repo: {
                                        branch: "a-rush-and-a-push",
                                        owner: "TheSmiths",
                                        repo: "strangeways",
                                    },
                                },
                            },
                        },
                    },
                    workspaceIds: ["AM0441SS3Y"],
                },
            } as any;
            const p: PushListenerInvocation = {
                id: {
                    branch: "a-rush-and-a-push",
                    owner: "TheSmiths",
                    providerType: ScmProviderType.github_com,
                    repo: "strangeways",
                    sha: "bb94dbf2a40b3754f2e62797c80923b938f60fb3",
                },
                push: {
                    commits: [
                        { message: "Stop me if you think you've heard this one before" },
                    ],
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t, "no push test was returned");
            s.configuration.sdm.k8s.options.sync.repo = {
                branch: "a-rush-and-a-push",
                owner: "TheSmiths",
                providerType: ScmProviderType.github_com,
                repo: "strangeways",
                setUserConfig: async () => { },
                url: "https://github.com/TheSmiths/strangeways",
            };
            const r = await t.mapping(p);
            assert(r === true, "push test result was false");
        });

        it("should return false if all self commits", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    name: "@atomist/k8s-sdm_i-started-something",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: {
                                        token: "j04nnym@44",
                                    },
                                    repo: {
                                        branch: "a-rush-and-a-push",
                                        owner: "TheSmiths",
                                        providerType: ScmProviderType.github_com,
                                        repo: "strangeways",
                                        setUserConfig: async () => { },
                                        url: "https://github.com/TheSmiths/strangeways",
                                    },
                                },
                            },
                        },
                    },
                    workspaceIds: ["AM0441SS3Y"],
                },
            } as any;
            const p: PushListenerInvocation = {
                id: {
                    branch: "a-rush-and-a-push",
                    owner: "TheSmiths",
                    providerType: ScmProviderType.github_com,
                    repo: "strangeways",
                    sha: "bb94dbf2a40b3754f2e62797c80923b938f60fb3",
                },
                push: {
                    commits: [
                        { message: "Stop me\n\n[atomist:sync-commit=@atomist/k8s-sdm_i-started-something]" },
                        { message: "If you've\n\n[atomist:sync-commit=@atomist/k8s-sdm_i-started-something]" },
                        { message: "Heard this\n\n[atomist:sync-commit=@atomist/k8s-sdm_i-started-something]" },
                        { message: "One before\n\n[atomist:sync-commit=@atomist/k8s-sdm_i-started-something]" },
                    ],
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t, "no push test was returned");
            const r = await t.mapping(p);
            assert(r === false, "push test result was true");
        });

        it("should return false if repo does not match", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    name: "@atomist/k8s-sdm_i-started-something",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: {
                                        token: "j04nnym@44",
                                    },
                                    repo: {
                                        branch: "a-rush-and-a-push",
                                        owner: "TheSmiths",
                                        providerType: ScmProviderType.github_com,
                                        repo: "strangeways",
                                        setUserConfig: async () => { },
                                        url: "https://github.com/TheSmiths/strangeways",
                                    },
                                },
                            },
                        },
                    },
                    workspaceIds: ["AM0441SS3Y"],
                },
            } as any;
            const o: PushListenerInvocation = {
                id: {
                    branch: "girlfriend-in-a-coma",
                    owner: "TheSmiths",
                    providerType: ScmProviderType.github_com,
                    repo: "strangeways",
                    sha: "bb94dbf2a40b3754f2e62797c80923b938f60fb3",
                },
                push: {
                    commits: [
                        { message: "Stop me\n\nIf you think" },
                        { message: "You've heard\n\nThis one before." },
                    ],
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t, "no push test was returned");
            const fs = [
                { branch: "girlfriend-in-a-coma" },
                { owner: "Electronic" },
                { providerType: "bitbucket" },
                { repo: "the-queen-is-dead" },
            ];
            for (const f of fs) {
                const p = _.merge({}, o, f);
                const r = await t.mapping(p);
                assert(r === false, `push test result was true when ${Object.keys(f)} differed`);
            }
        });

        it("should throw an error if no RemoteRepoRef", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    name: "@atomist/k8s-sdm_i-started-something",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: {
                                        token: "j04nnym@44",
                                    },
                                    repo: {
                                        branch: "a-rush-and-a-push",
                                        owner: "TheSmiths",
                                        repo: "strangeways",
                                    },
                                },
                            },
                        },
                    },
                    workspaceIds: ["AM0441SS3Y"],
                },
            } as any;
            const p: PushListenerInvocation = {
                id: {
                    branch: "girlfriend-in-a-coma",
                    owner: "TheSmiths",
                    providerType: ScmProviderType.github_com,
                    repo: "strangeways",
                    sha: "bb94dbf2a40b3754f2e62797c80923b938f60fb3",
                },
                push: {
                    commits: [
                        { message: "Stop me\n\nIf you think" },
                        { message: "You've heard\n\nThis one before." },
                    ],
                },
            } as any;
            const t = isSyncRepoCommit(s);
            assert(t, "no push test was returned");
            let thrown = false;
            try {
                await t.mapping(p);
                assert.fail("should have thrown an error");
            } catch (e) {
                thrown = true;
                assert(e.message.startsWith("SyncRepoRef did not get converted to proper RemoteRepoRef at startup"));
            }
            assert(thrown, "should have thrown an error");
        });

    });

});
