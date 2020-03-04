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

import * as assert from "power-assert";
import {
    appExternalUrls,
    endpointBaseUrl,
    kubeClusterHostScheme,
} from "../../../../../lib/core/pack/k8s/deploy/externalUrls";
import { KubernetesApplication } from "../../../../../lib/core/pack/k8s/kubernetes/request";

describe("core/pack/k8s/deploy/externalUrls", () => {

    describe("kubeClusterHostScheme", () => {

        it("should return undefined", () => {
            [
                undefined,
                {},
                { ingressSpec: undefined },
                { ingressSpec: { spec: undefined } },
                { ingressSpec: { spec: {} } },
                { ingressSpec: { spec: { rules: undefined } } },
                { ingressSpec: { spec: { rules: [] } } },
                { ingressSpec: { spec: { rules: [{}, { http: undefined }] } } },
                { ingressSpec: { spec: { rules: [{}, { http: {} }] } } },
                { ingressSpec: { spec: { rules: [{}, { http: { paths: undefined } }] } } },
                { ingressSpec: { spec: { rules: [{}, { http: { paths: [] } }] } } },
            ].forEach((a: any) => {
                const h = kubeClusterHostScheme(a);
                assert.deepStrictEqual(h, undefined);
            });
        });

        it("should find a host but no TLS secret", () => {
            const a = {
                ingressSpec: {
                    spec: {
                        rules: [
                            {},
                            { host: "emi.com" },
                        ],
                    },
                },
            };
            const h = kubeClusterHostScheme(a);
            assert.deepStrictEqual(h, "http://emi.com");
        });

    });

    describe("endpointBaseUrl", () => {

        it("should return undefined when no path", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const u = endpointBaseUrl(r);
            assert(u === undefined);
        });

        it("should return the host and path", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                        tls: [{ hosts: ["emi.com"] }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should return http protocol with no tlsSecret", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should find host tls", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{}, { host: "emi.com" }],
                        tls: [{}, { hosts: [] }, { hosts: ["ime.com", "emi.com"] }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should return http when host tls not found", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{}, { host: "emi.com" }],
                        tls: [{}, { hosts: [] }, { hosts: ["ime.com"] }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should not add / to path that already has it", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting/",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                        tls: [{ hosts: ["emi.com"] }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should prepend / to path that is missing it", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                    },
                },
            };
            const u = endpointBaseUrl(r);
            const e = `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

    });

    describe("appExternalUrls", () => {

        it("should return undefined", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const u = appExternalUrls(r);
            assert(u === undefined);
        });

        it("should return the host and path", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                        tls: [{ hosts: ["emi.com"] }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should return http protocol with no tlsSecret", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "http",
                url: `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should return https protocol when TLS secret found", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{}, { host: "emi.com" }],
                        tls: [{}, { hosts: [] }, { hosts: ["emi.com"] }, { hosts: ["ime.com"] }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should return http protocol when no matching TLS secret", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{}, { host: "emi.com" }],
                        tls: [{}, { hosts: [] }, { hosts: ["e.mi.com"] }, { hosts: ["ime.com"] }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "http",
                url: `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should not add / to path that already has it", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting/",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                        tls: [{ hosts: ["emi.com"] }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should prepend / to path that is missing it", () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "bush/kate/hounds-of-love/cloudbusting",
                ingressSpec: {
                    spec: {
                        rules: [{ host: "emi.com" }],
                        tls: [{ hosts: ["emi.com"] }],
                    },
                },
            };
            const u = appExternalUrls(r);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

    });

});
