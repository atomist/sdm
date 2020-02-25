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
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import {
    appExternalUrls,
    endpointBaseUrl,
} from "../../../../../lib/core/pack/k8s/deploy/externalUrls";
import { KubernetesApplication } from "../../../../../lib/core/pack/k8s/kubernetes/request";

describe("pack/k8s/deploy/externalUrls", () => {

    describe("endpointBaseUrl", () => {

        it("should return undefined", async () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const u = await endpointBaseUrl(r);
            assert(u === undefined);
        });

        it("should return the host and path", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const u = await endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should return http protocol with no tlsSecret", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
            };
            const u = await endpointBaseUrl(r);
            const e = `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should return https protocol with tslSecret", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                tlsSecret: "wickham",
            };
            const u = await endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should not add / to path that already has it", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting/",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const u = await endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should prepend / to path that is missing it", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const u = await endpointBaseUrl(r);
            const e = `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`;
            assert(u === e);
        });

        it("should return undefined in local mode", async () => {
            let mode: string;
            if (process.env.ATOMIST_MODE) {
                mode = process.env.ATOMIST_MODE;
            }
            process.env.ATOMIST_MODE = "local";
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const u = await endpointBaseUrl(r);
            if (mode) {
                process.env.ATOMIST_MODE = mode;
            } else {
                delete process.env.ATOMIST_MODE;
            }
            assert(u === undefined);
        });

        it("should return default-like endpoint in local mode", async () => {
            let mode: string;
            if (process.env.ATOMIST_MODE) {
                mode = process.env.ATOMIST_MODE;
            }
            process.env.ATOMIST_MODE = "local";
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/",
            };
            const u = await endpointBaseUrl(r);
            if (mode) {
                process.env.ATOMIST_MODE = mode;
            } else {
                delete process.env.ATOMIST_MODE;
            }
            assert(/^http:\/\/\d+\.\d+\.\d+\.\d+\/$/.test(u));
        });

        it("should return endpoint in local mode", async () => {
            let mode: string;
            if (process.env.ATOMIST_MODE) {
                mode = process.env.ATOMIST_MODE;
            }
            process.env.ATOMIST_MODE = "local";
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                tlsSecret: "wickham",
            };
            const u = await endpointBaseUrl(r);
            if (mode) {
                process.env.ATOMIST_MODE = mode;
            } else {
                delete process.env.ATOMIST_MODE;
            }
            assert(/^https:\/\/\d+\.\d+\.\d+\.\d+\/bush\/kate\/hounds-of-love\/cloudbusting\/$/.test(u));
        });

    });

    describe("appExternalUrls", () => {

        it("should return undefined", async () => {
            const r: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            assert(u === undefined);
        });

        it("should return the host and path", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should return http protocol with no tlsSecret", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            const e = [{
                label: "http",
                url: `http://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should return https protocol with tslSecret", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                tlsSecret: "wickham",
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should not add / to path that already has it", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "/bush/kate/hounds-of-love/cloudbusting/",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

        it("should prepend / to path that is missing it", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                path: "bush/kate/hounds-of-love/cloudbusting",
                host: "emi.com",
                protocol: "https" as "https",
            };
            const g: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const u = await appExternalUrls(r, g);
            const e = [{
                label: "https",
                url: `https://emi.com/bush/kate/hounds-of-love/cloudbusting/`,
            }];
            assert.deepStrictEqual(u, e);
        });

    });

});
