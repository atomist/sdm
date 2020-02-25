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

/* tslint:disable:max-file-line-count */

import { BitBucketServerRepoRef } from "@atomist/automation-client/lib/operations/common/BitBucketServerRepoRef";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { GitlabRepoRef } from "@atomist/automation-client/lib/operations/common/GitlabRepoRef";
import { TokenCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { ProviderType as ScmProviderType } from "@atomist/automation-client/lib/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import * as assert from "power-assert";
import { SoftwareDeliveryMachine } from "../../../../../lib/api/machine/SoftwareDeliveryMachine";
import { DefaultRepoRefResolver } from "../../../../../lib/core/handlers/common/DefaultRepoRefResolver";
import {
    isRemoteRepo,
    queryForScmProvider,
    repoCredentials,
    scmCredentials,
} from "../../../../../lib/core/pack/k8s/sync/repo";
import {
    RepoScmProvider,
    ScmProviders,
} from "../../../../../lib/typings/types";

describe("pack/k8s/sync/repo", () => {

    describe("isRemoteRepo", () => {

        it("should return false if nothing passed", () => {
            [undefined, {}].forEach((x: any) => assert(!isRemoteRepo(x)));
        });

        it("should return false for SyncRepoRef", () => {
            const r = {
                branch: "the-slim",
                owner: "bob-mould",
                providerId: "copper-blue",
                repo: "sugar",
            };
            assert(!isRemoteRepo(r));
        });

        it("should return true for a RemoteRepoRef", () => {
            const r = GitHubRepoRef.from({
                branch: "the-slim",
                owner: "bob-mould",
                path: "copper/blue",
                repo: "sugar",
            });
            assert(isRemoteRepo(r));
        });

    });

    describe("scmCredentials", () => {

        it("should return undefined if not provided enough information", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {} as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no apiUrl", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                credential: {
                    secret: "m@n-0n-th3-m00n",
                },
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no credential", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://api.github.com",
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no secret", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://api.github.com",
                credential: {} as any,
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no owner", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://api.github.com",
                credential: {
                    secret: "m@n-0n-th3-m00n",
                },
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no repo", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://api.github.com",
                credential: {
                    secret: "m@n-0n-th3-m00n",
                },
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return ghe repo ref", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://ghe.sugar.com/api/v3",
                credential: {
                    secret: "m@n-0n-th3-m00n",
                },
                providerType: "ghe" as any,
                url: "https://ghe.sugar.com/",
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc, "no RepoCredentials returned");
            assert((rc.credentials as TokenCredentials).token === "m@n-0n-th3-m00n");
            assert((rc.repo as GitHubRepoRef).apiBase === "ghe.sugar.com/api/v3");
            assert(rc.repo.branch === undefined);
            assert(rc.repo.owner === "bob-mould");
            assert(rc.repo.path === undefined);
            assert(rc.repo.providerType === ScmProviderType.ghe);
            assert(rc.repo.remoteBase === "ghe.sugar.com");
            assert(rc.repo.repo === "sugar");
            assert((rc.repo as GitHubRepoRef).scheme === "https://");
        });

        it("should use branch and provided credentials", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "tilted" },
                                    repo: {
                                        branch: "beaster",
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://api.github.com",
                credential: {
                    secret: "m@n-0n-th3-m00n",
                },
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc, "no RepoCredentials returned");
            assert((rc.credentials as TokenCredentials).token === "tilted");
            assert((rc.repo as GitHubRepoRef).apiBase === "api.github.com");
            assert(rc.repo.branch === "beaster");
            assert(rc.repo.owner === "bob-mould");
            assert(rc.repo.path === undefined);
            assert(rc.repo.providerType === ScmProviderType.github_com);
            assert(rc.repo.remoteBase === "github.com");
            assert(rc.repo.repo === "sugar");
            assert((rc.repo as GitHubRepoRef).scheme === "https://");
        });

        it("should create a bitbucket", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "FunHouse",
                                        owner: "TheStooges",
                                        repo: "iggy",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: ScmProviders.ScmProvider = {
                apiUrl: "https://bitbucket.iggyandthestooges.com/",
                credential: {
                    secret: "1w@nn@b3y0u4d0g",
                },
                providerType: "bitbucket" as any,
            } as any;
            const rc = scmCredentials(m, s);
            assert(rc, "no RepoCredentials returned");
            assert((rc.credentials as TokenCredentials).token === "1w@nn@b3y0u4d0g");
            assert((rc.repo as BitBucketServerRepoRef).apiBase === "bitbucket.iggyandthestooges.com/rest/api/1.0");
            assert(rc.repo.branch === "FunHouse");
            assert(rc.repo.owner === "TheStooges");
            assert(rc.repo.providerType === ScmProviderType.bitbucket);
            assert(rc.repo.remoteBase === "bitbucket.iggyandthestooges.com");
            assert(rc.repo.repo === "iggy");
            assert((rc.repo as BitBucketServerRepoRef).scheme === "https://");
        });

    });

    describe("repoCredentials", () => {

        it("should return undefined if not provided enough information", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: RepoScmProvider.Repo = {};
            const rc = repoCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no scmProvider", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: RepoScmProvider.Repo = {
                org: {},
            };
            const rc = repoCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return undefined if no scmProvider properties", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: RepoScmProvider.Repo = {
                org: {
                    scmProvider: {} as any,
                },
            };
            const rc = repoCredentials(m, s);
            assert(rc === undefined);
        });

        it("should return remote repo ref", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: RepoScmProvider.Repo = {
                org: {
                    scmProvider: {
                        apiUrl: "https://api.github.com",
                        credential: {
                            secret: "m@n-0n-th3-m00n",
                        },
                    } as any,
                },
            };
            const rc = repoCredentials(m, s);
            assert(rc, "no RepoCredentials returned");
            assert((rc.credentials as TokenCredentials).token === "m@n-0n-th3-m00n");
            assert((rc.repo as GitHubRepoRef).apiBase === "api.github.com");
            assert(rc.repo.branch === undefined);
            assert(rc.repo.owner === "bob-mould");
            assert(rc.repo.path === undefined);
            assert(rc.repo.providerType === ScmProviderType.github_com);
            assert(rc.repo.remoteBase === "github.com");
            assert(rc.repo.repo === "sugar");
            assert((rc.repo as GitHubRepoRef).scheme === "https://");
        });

        it("should create a gitlab ref with provided credentials", () => {
            const m: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        repoRefResolver: new DefaultRepoRefResolver(),
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "Frankenstein" },
                                    repo: {
                                        branch: "too-much-too-soon",
                                        owner: "NewYorkDolls",
                                        repo: "trash",
                                    },
                                },
                            },
                        },
                    },
                },
            } as any;
            const s: RepoScmProvider.Repo = {
                org: {
                    scmProvider: {
                        apiUrl: "http://gitlab.nydolls.com/api/v4/",
                        credential: {
                            secret: "P34$0n@l1tyC41$1$",
                        },
                        providerType: "gitlab" as any,
                        url: "http://gitlab.nydolls.com/",
                    } as any,
                },
            };
            const rc = repoCredentials(m, s);
            assert(rc, "no RepoCredentials returned");
            assert((rc.credentials as TokenCredentials).token === "Frankenstein");
            assert((rc.repo as GitlabRepoRef).apiBase === "gitlab.nydolls.com/api/v4");
            assert(rc.repo.branch === "too-much-too-soon");
            assert(rc.repo.owner === "NewYorkDolls");
            assert(rc.repo.path === undefined);
            assert(rc.repo.providerType === ScmProviderType.gitlab_enterprise);
            assert(rc.repo.remoteBase === "gitlab.nydolls.com");
            assert(rc.repo.repo === "trash");
            assert((rc.repo as GitlabRepoRef).scheme === "http://");
        });

    });

    describe("queryForScmProvider", () => {

        it("should find the repo", async () => {
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "A4USK34DU");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "RepoScmProvider") {
                                                queried = true;
                                                assert(o.variables.owner === "bob-mould");
                                                assert(o.variables.repo === "sugar");
                                                return {
                                                    Repo: [
                                                        {
                                                            defaultBranch: "copper-blue",
                                                            name: "sugar",
                                                            org: {
                                                                scmProvider: {
                                                                    apiUrl: "https://api.github.com",
                                                                    credential: {
                                                                        secret: "m@n-0n-th3-m00n",
                                                                    },
                                                                },
                                                            },
                                                            owner: "bob-mould",
                                                        },
                                                    ],
                                                };
                                            }
                                            return { SCMProvider: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "beaster",
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["A4USK34DU"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "m@n-0n-th3-m00n");
            assert(ss.repo.apiBase === "api.github.com");
            assert(ss.repo.branch === "beaster");
            assert(ss.repo.owner === "bob-mould");
            assert(ss.repo.path === undefined);
            assert(ss.repo.providerType === ScmProviderType.github_com);
            assert(ss.repo.remoteBase === "github.com");
            assert(ss.repo.repo === "sugar");
            assert(ss.repo.scheme === "https://");
        });

        it("should use the default branch and configured credentials", async () => {
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "A4USK34DU");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "RepoScmProvider") {
                                                queried = true;
                                                assert(o.variables.owner === "bob-mould");
                                                assert(o.variables.repo === "sugar");
                                                return {
                                                    Repo: [
                                                        {
                                                            defaultBranch: "copper-blue",
                                                            name: "sugar",
                                                            org: {
                                                                scmProvider: {
                                                                    apiUrl: "https://api.github.com",
                                                                    credential: {
                                                                        secret: "m@n-0n-th3-m00n",
                                                                    },
                                                                },
                                                            },
                                                            owner: "bob-mould",
                                                        },
                                                    ],
                                                };
                                            }
                                            return { SCMProvider: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "H00v34D@m" },
                                    repo: {
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["A4USK34DU"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "H00v34D@m");
            assert(ss.repo.apiBase === "api.github.com");
            assert(ss.repo.branch === "copper-blue");
            assert(ss.repo.owner === "bob-mould");
            assert(ss.repo.path === undefined);
            assert(ss.repo.providerType === ScmProviderType.github_com);
            assert(ss.repo.remoteBase === "github.com");
            assert(ss.repo.repo === "sugar");
            assert(ss.repo.scheme === "https://");
        });

        it("should find the repo with correct provider ID", async () => {
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "A4USK34DU");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "RepoScmProvider") {
                                                queried = true;
                                                assert(o.variables.owner === "bob-mould");
                                                assert(o.variables.repo === "sugar");
                                                return {
                                                    Repo: [
                                                        {
                                                            defaultBranch: "copper-blue",
                                                            name: "sugar",
                                                            org: {
                                                                scmProvider: {
                                                                    apiUrl: "https://ghe.mould.com/v3",
                                                                    credential: {
                                                                        secret: "m@n-0n-th3-m00n",
                                                                    },
                                                                    providerId: "hoover-dam",
                                                                },
                                                            },
                                                            owner: "bob-mould",
                                                        },
                                                        {
                                                            defaultBranch: "copper-blue",
                                                            name: "sugar",
                                                            org: {
                                                                scmProvider: {
                                                                    apiUrl: "https://api.github.com",
                                                                    credential: {
                                                                        secret: "m@n-0n-th3-m00n",
                                                                    },
                                                                    providerId: "slim",
                                                                },
                                                            },
                                                            owner: "bob-mould",
                                                        },
                                                    ],
                                                };
                                            }
                                            return { SCMProvider: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "beaster",
                                        owner: "bob-mould",
                                        repo: "sugar",
                                        providerId: "slim",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["A4USK34DU"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "m@n-0n-th3-m00n");
            assert(ss.repo.apiBase === "api.github.com");
            assert(ss.repo.branch === "beaster");
            assert(ss.repo.owner === "bob-mould");
            assert(ss.repo.path === undefined);
            assert(ss.repo.providerType === ScmProviderType.github_com);
            assert(ss.repo.remoteBase === "github.com");
            assert(ss.repo.repo === "sugar");
            assert(ss.repo.scheme === "https://");
        });

        it("should find nothing and delete sync options", async () => {
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "A4USK34DU");
                                    return {
                                        query: async (o: any) => {
                                            queried = true;
                                            return (o.name === "RepoScmProvider") ? { Repo: [] as any[] } : { SCMProvider: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "beaster",
                                        owner: "bob-mould",
                                        repo: "sugar",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["A4USK34DU"],
                },
            } as any;
            assert(!await queryForScmProvider(s));
            assert(queried, "query method never called");
            assert(s.configuration.sdm.k8s.options.sync === undefined);
        });

        it("should find the repo via the provider", async () => {
            const clonedOrig = GitCommandGitProject.cloned;
            GitCommandGitProject.cloned = async (creds, id, opts) => ({} as any);
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "IGGYP0P");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "ScmProviders") {
                                                queried = true;
                                                return {
                                                    SCMProvider: [
                                                        {
                                                            apiUrl: "https://bitbucket.iggyandthestooges.com/",
                                                            credential: {
                                                                secret: "1w@nn@b3y0u4d0g",
                                                            },
                                                            providerType: "bitbucket",
                                                        },
                                                    ],
                                                };
                                            }
                                            assert(o.variables.owner === "TheStooges");
                                            assert(o.variables.repo === "iggy");
                                            return { Repo: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "FunHouse",
                                        owner: "TheStooges",
                                        repo: "iggy",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["IGGYP0P"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            GitCommandGitProject.cloned = clonedOrig;
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "1w@nn@b3y0u4d0g");
            assert(ss.repo.apiBase === "bitbucket.iggyandthestooges.com/rest/api/1.0");
            assert(ss.repo.branch === "FunHouse");
            assert(ss.repo.owner === "TheStooges");
            assert(ss.repo.providerType === ScmProviderType.bitbucket);
            assert(ss.repo.remoteBase === "bitbucket.iggyandthestooges.com");
            assert(ss.repo.repo === "iggy");
            assert(ss.repo.scheme === "https://");
        });

        it("should return what was provided", async () => {
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "3.T.V.3y3" },
                                    repo: GitHubRepoRef.from({
                                        branch: "FunHouse",
                                        owner: "TheStooges",
                                        path: "cluster/specs",
                                        repo: "iggy",
                                    }),
                                },
                            },
                        },
                    },
                },
            } as any;
            assert(await queryForScmProvider(s));
            const e = {
                credentials: { token: "3.T.V.3y3" },
                repo: GitHubRepoRef.from({
                    branch: "FunHouse",
                    owner: "TheStooges",
                    path: "cluster/specs",
                    repo: "iggy",
                }),
            };
            assert.deepStrictEqual(s.configuration.sdm.k8s.options.sync, e);
        });

        it("should use the provided repo and queried credentials", async () => {
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "DB00N");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "RepoScmProvider") {
                                                queried = true;
                                                assert(o.variables.owner === "minutemen");
                                                assert(o.variables.repo === "double-nickels-on-the-dime");
                                                return {
                                                    Repo: [
                                                        {
                                                            defaultBranch: "55-on-10",
                                                            name: "double-nickels-on-the-dime",
                                                            org: {
                                                                scmProvider: {
                                                                    apiUrl: "https://gitlab.minutemen.org/api/v4",
                                                                    credential: {
                                                                        secret: "21.T@k35,D",
                                                                    },
                                                                },
                                                            },
                                                            owner: "minutemen",
                                                        },
                                                    ],
                                                };
                                            }
                                            return { SCMProvider: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: GitlabRepoRef.from({
                                        branch: "toadies",
                                        gitlabRemoteUrl: "https://gitlab.minutemen.org/",
                                        owner: "minutemen",
                                        path: "04/cohesion",
                                        rawApiBase: "https://gitlab.minutemen.org/api/v4",
                                        repo: "double-nickels-on-the-dime",
                                    }),
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["DB00N"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "21.T@k35,D");
            const re = GitlabRepoRef.from({
                branch: "toadies",
                gitlabRemoteUrl: "https://gitlab.minutemen.org/",
                owner: "minutemen",
                path: "04/cohesion",
                rawApiBase: "https://gitlab.minutemen.org/api/v4",
                repo: "double-nickels-on-the-dime",
            });
            assert.deepStrictEqual(ss.repo, re);
            assert(ss.repo.apiBase === "gitlab.minutemen.org/api/v4");
            assert(ss.repo.branch === "toadies");
            assert(ss.repo.owner === "minutemen");
            assert(ss.repo.path === "04/cohesion");
            assert(ss.repo.providerType === ScmProviderType.gitlab_enterprise);
            assert(ss.repo.remoteBase === "gitlab.minutemen.org");
            assert(ss.repo.repo === "double-nickels-on-the-dime");
            assert(ss.repo.scheme === "https://");
        });

        it("should find the repo with proper provider ID via provider", async () => {
            const clonedOrig = GitCommandGitProject.cloned;
            GitCommandGitProject.cloned = async (creds, id, opts) => ({} as any);
            let queried = false;
            const s: SoftwareDeliveryMachine = {
                configuration: {
                    graphql: {
                        client: {
                            factory: {
                                create: (w: string) => {
                                    assert(w === "IGGYP0P");
                                    return {
                                        query: async (o: any) => {
                                            if (o.name === "ScmProviders") {
                                                queried = true;
                                                return {
                                                    SCMProvider: [
                                                        {
                                                            apiUrl: "https://api.github.com/",
                                                            credential: {
                                                                secret: "R3@1C001T1m3",
                                                            },
                                                            providerId: "proto-punk",
                                                            providerType: "github_com",
                                                        },
                                                        {
                                                            apiUrl: "https://bitbucket.iggyandthestooges.com/",
                                                            credential: {
                                                                secret: "1w@nn@b3y0u4d0g",
                                                            },
                                                            providerId: "garage-rock",
                                                            providerType: "bitbucket",
                                                        },
                                                    ],
                                                };
                                            }
                                            assert(o.variables.owner === "TheStooges");
                                            assert(o.variables.repo === "iggy");
                                            return { Repo: [] as any[] };
                                        },
                                    };
                                },
                            },
                        },
                    },
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    repo: {
                                        branch: "FunHouse",
                                        owner: "TheStooges",
                                        repo: "iggy",
                                        providerId: "garage-rock",
                                    },
                                },
                            },
                        },
                        repoRefResolver: new DefaultRepoRefResolver(),
                    },
                    workspaceIds: ["IGGYP0P"],
                },
            } as any;
            assert(await queryForScmProvider(s));
            GitCommandGitProject.cloned = clonedOrig;
            assert(queried, "query method never called");
            const ss = s.configuration.sdm.k8s.options.sync;
            assert(ss.credentials.token === "1w@nn@b3y0u4d0g");
            assert(ss.repo.apiBase === "bitbucket.iggyandthestooges.com/rest/api/1.0");
            assert(ss.repo.branch === "FunHouse");
            assert(ss.repo.owner === "TheStooges");
            assert(ss.repo.providerType === ScmProviderType.bitbucket);
            assert(ss.repo.remoteBase === "bitbucket.iggyandthestooges.com");
            assert(ss.repo.repo === "iggy");
            assert(ss.repo.scheme === "https://");
        });

    });

});
