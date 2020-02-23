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

import * as acglobals from "@atomist/automation-client/lib/globals";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as k8s from "@kubernetes/client-node";
import * as assert from "power-assert";
import { fakeContext } from "../../../../../lib/api-helper/testsupport/fakeContext";
import * as apply from "../../../../../lib/core/pack/k8s/kubernetes/apply";
import {
    kubernetesSync,
    repoSync,
    sortSpecs,
} from "../../../../../lib/core/pack/k8s/sync/sync";

describe("pack/k8s/sync/sync", () => {

    describe("kubernetesSync", () => {

        it("should return the command with intent", () => {
            const s: any = {
                configuration: {
                    name: "@imogen/heap",
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: true,
                            },
                        },
                    },
                },
            };
            const c = kubernetesSync(s);
            assert(c.name === "KubernetesSync");
            assert(c.intent === "kube sync imogen/heap");
        });

        it("should return the command without intent", () => {
            const s: any = {
                configuration: {
                    name: "@imogen/heap",
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: false,
                            },
                        },
                    },
                },
            };
            const c = kubernetesSync(s);
            assert(c.name === "KubernetesSync");
            assert(c.intent === undefined);
        });

    });

    describe("sortSpecs", () => {

        it("should sort nothing successfully", async () => {
            const r: GitProject = InMemoryProject.of() as any;
            const s = await sortSpecs(r);
            assert.deepStrictEqual(s, []);
        });

        it("should sort specs successfully", async () => {
            const r: GitProject = InMemoryProject.of(
                { path: "80-b-deployment.json", content: "{}" },
                { path: "60-c-service.json", content: "{}" },
                { path: "60-d-service.json", content: "{}" },
                { path: "80-a-deployment.yaml", content: "kind: Deployment\n" },
                { path: "00-x-daemonset.json", content: "{}" },
                { path: "50-z-ingress.yml", content: "" },
            ) as any;
            const s = await sortSpecs(r);
            assert(s.length === 6);
            assert(s[0].name === "00-x-daemonset.json");
            assert(s[1].name === "50-z-ingress.yml");
            assert(s[2].name === "60-c-service.json");
            assert(s[3].name === "60-d-service.json");
            assert(s[4].name === "80-a-deployment.yaml");
            assert(s[5].name === "80-b-deployment.json");
        });

        it("should exclude non-spec files", async () => {
            const r: GitProject = InMemoryProject.of(
                { path: "README.md", content: "# Project\n" },
                { path: "80-b-deployment.json", content: "{}" },
                { path: "60-c-service.json", content: "{}" },
                { path: "index.ts", content: "" },
                { path: "60-d-service.json", content: "{}" },
                { path: "80-a-deployment.yaml", content: "kind: Deployment\n" },
                { path: "lib/stuff.ts", content: "" },
                { path: "00-x-daemonset.json", content: "{}" },
                { path: "50-z-ingress.yml", content: "" },
                { path: "test/stuff.test.ts", content: "" },
            ) as any;
            const s = await sortSpecs(r);
            assert(s.length === 6);
            assert(s[0].name === "00-x-daemonset.json");
            assert(s[1].name === "50-z-ingress.yml");
            assert(s[2].name === "60-c-service.json");
            assert(s[3].name === "60-d-service.json");
            assert(s[4].name === "80-a-deployment.yaml");
            assert(s[5].name === "80-b-deployment.json");
        });

    });

    describe("repoSync", () => {

        let originalApplySpec: any;
        let originalAutomationClient: any;
        let specs: k8s.KubernetesObject[];
        before(() => {
            originalApplySpec = Object.getOwnPropertyDescriptor(apply, "applySpec");
            Object.defineProperty(apply, "applySpec", {
                value: async (s: k8s.KubernetesObject) => {
                    specs.push(s);
                    return {
                        body: s,
                        response: { code: 200 },
                    };
                },
            });
            originalAutomationClient = Object.getOwnPropertyDescriptor(acglobals, "automationClientInstance");
        });
        after(() => {
            Object.defineProperty(apply, "applySpec", originalApplySpec);
            Object.defineProperty(acglobals, "automationClientInstance", originalAutomationClient);
        });
        beforeEach(() => {
            specs = [];
        });

        const r: GitProject = InMemoryProject.of(
            { path: "README.md", content: "# Joe Henry\n## Scar\n" },
            { path: "70_jlh_stop_deployment.json", content: `{"apiVersion":"apps/v1","kind":"Deployment","metadata":{"name":"stop"}}` },
            { path: "60_jlh_stop_service.json", content: `{"apiVersion":"v1","kind":"Service","metadata":{"name":"stop","namespace":"jlh"}}` },
            { path: "index.ts", content: "#! /usr/bin/env node\n" },
            { path: "assets/kubectl/60-d-service.json", content: `{"metadata":{"annotations":{}}}` },
            { path: "70_scar_scar_dep.yaml", content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: scar\n  namespace: scar\n" },
            { path: "lib/stuff.ts", content: "// comment\n" },
            { path: "00_guest_ornette_ds.json", content: `{"apiVersion":"apps/v1","kind":"DaemonSet","metadata":{"name":"ornette"}}` },
            {
                path: "80_jlh_stop_ingress.yml",
                content: "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: stop\n  namespace: jlh\n",
            },
            { path: "test/stuff.test.ts", content: "/* comment */" },
            {
                path: "60_jlh_stop_secret.yml",
                content: "apiVersion: v1\nkind: Secret\nmetadata:\n  name: stop\n  namespace: jlh\ndata:\n  amor: +WgqDCG3DW42vXwmS/ZYAg==\n",
            },
        ) as any;
        const context = fakeContext("AT34RFU1N4T10N");

        it("should sync the repo successfully", async () => {
            let loaded = false;
            const cli: any = {
                configuration: {
                    name: "@joe-henry/scar",
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "RichardPryorAddressesATearfulNation" },
                                    repo: GitHubRepoRef.from({
                                        branch: "scar",
                                        owner: "reprise",
                                        repo: "JoeHenry",
                                    }),
                                    secretKey: "Edgar Bergen",
                                },
                            },
                        },
                        projectLoader: {
                            doWithProject: async (p: any, a: any) => {
                                loaded = true;
                                assert(p.credentials.token === "RichardPryorAddressesATearfulNation");
                                assert(p.id.branch === "scar");
                                assert(p.id.owner === "reprise");
                                assert(p.id.repo === "JoeHenry");
                                assert(p.readOnly === true);
                                return a(r);
                            },
                        },
                    },
                },
                context,
            };
            Object.defineProperty(acglobals, "automationClientInstance", {
                value: () => ({ configuration: cli.configuration }),
            });
            const v = await repoSync(cli);
            assert(v.code === 0);
            assert(v.message === "Successfully completed sync of repo reprise/JoeHenry");
            assert(loaded, "Project was never loaded");
            const eSpecs = [
                { apiVersion: "apps/v1", kind: "DaemonSet", metadata: { name: "ornette" } },
                { apiVersion: "v1", kind: "Secret", metadata: { name: "stop", namespace: "jlh" }, data: { amor: "U3RvcA==" } },
                { apiVersion: "v1", kind: "Service", metadata: { name: "stop", namespace: "jlh" } },
                { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "stop" } },
                { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "scar", namespace: "scar" } },
                { apiVersion: "networking.k8s.io/v1", kind: "Ingress", metadata: { name: "stop", namespace: "jlh" } },
            ];
            assert.deepStrictEqual(specs, eSpecs);
        });

        it("should detect if there are no sync options", async () => {
            const cli: any = {
                configuration: {
                    sdm: {
                        k8s: {},
                        projectLoader: {
                            doWithProject: async () => { },
                        },
                    },
                },
                context,
            };
            const v = await repoSync(cli);
            assert(v.code === 2);
            assert(v.message === "SDM has no sync options defined");
        });

        it("should detect if sync repo is not a RemoteRepoRef", async () => {
            const cli: any = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "RichardPryorAddressesATearfulNation" },
                                    repo: {
                                        branch: "scar",
                                        owner: "reprise",
                                        repo: "JoeHenry",
                                    },
                                    secretKey: "Edgar Bergen",
                                },
                            },
                        },
                        projectLoader: {
                            doWithProject: async () => { },
                        },
                    },
                },
                context,
            };
            const v = await repoSync(cli);
            assert(v.code === 2);
            assert(v.message === "SDM sync option repo is not a valid remote repo");
        });

        it("should detect a failure", async () => {
            const cli: any = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "RichardPryorAddressesATearfulNation" },
                                    repo: GitHubRepoRef.from({
                                        branch: "scar",
                                        owner: "reprise",
                                        repo: "JoeHenry",
                                    }),
                                    secretKey: "Edgar Bergen",
                                },
                            },
                        },
                        projectLoader: {
                            doWithProject: async (p: any, a: any) => {
                                throw new Error("doWithProject failure");
                            },
                        },
                    },
                },
                context,
            };
            const v = await repoSync(cli);
            assert(v.code === 1);
            assert(v.message === "Failed to sync repo reprise/JoeHenry: doWithProject failure");
        });

    });

    describe("repoSync apply failure", () => {

        let originalApplySpec: any;
        let specs: k8s.KubernetesObject[];
        before(() => {
            originalApplySpec = Object.getOwnPropertyDescriptor(apply, "applySpec");
            Object.defineProperty(apply, "applySpec", {
                value: async (s: k8s.KubernetesObject) => {
                    if (s.apiVersion === "apps/v1" && s.kind === "Deployment" && s.metadata.name === "stop") {
                        throw new Error("applySpec failure");
                    }
                    specs.push(s);
                },
            });
        });
        after(() => {
            Object.defineProperty(apply, "applySpec", originalApplySpec);
        });
        beforeEach(() => {
            specs = [];
        });

        it("should handle applySpec failure", async () => {
            const r: GitProject = InMemoryProject.of(
                { path: "README.md", content: "# Joe Henry\n## Scar\n" },
                { path: "d.json", content: `{"apiVersion":"apps/v1","kind":"Deployment","metadata":{"name":"stop","namespace":"jlh"}}` },
                { path: "60_jlh_stop_service.json", content: `{"apiVersion":"v1","kind":"Service","metadata":{"name":"stop","namespace":"jlh"}}` },
                { path: "index.ts", content: "#! /usr/bin/env node\n" },
                { path: "assets/kubectl/60-d-service.json", content: `{"metadata":{"annotations":{}}}` },
                { path: "70_scar_scar_dep.yaml", content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: scar\n  namespace: scar\n" },
                { path: "lib/stuff.ts", content: "// comment\n" },
                { path: "00_guest_ornette_ds.json", content: `{"apiVersion":"apps/v1","kind":"DaemonSet","metadata":{"name":"ornette"}}` },
                {
                    path: "80_jlh_stop_ingress.yml",
                    content: "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: stop\n  namespace: jlh\n",
                },
                { path: "test/stuff.test.ts", content: "/* comment */" },
                {
                    path: "60_jlh_stop_secret.yml",
                    content: "apiVersion: v1\nkind: Secret\nmetadata:\n  name: stop\n  namespace: jlh\ndata:\n  amor: +WgqDCG3DW42vXwmS/ZYAg==\n",
                },
            ) as any;
            const context = fakeContext("AT34RFU1N4T10N");
            const cli: any = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                sync: {
                                    credentials: { token: "RichardPryorAddressesATearfulNation" },
                                    repo: GitHubRepoRef.from({
                                        branch: "scar",
                                        owner: "reprise",
                                        repo: "JoeHenry",
                                    }),
                                    secretKey: "Edgar Bergen",
                                },
                            },
                        },
                        projectLoader: {
                            doWithProject: async (p: any, a: any) => a(r),
                        },
                    },
                },
                context,
            };
            const v = await repoSync(cli);
            assert(v.code === 1);
            const eMessage = "Failed to sync repo reprise/JoeHenry: There were errors during repo sync: Failed to apply " +
                "spec 'apps/v1/jlh/deployments/stop' from 'd.json': applySpec failure";
            assert(v.message === eMessage);
            const eSpecs = [
                { apiVersion: "apps/v1", kind: "DaemonSet", metadata: { name: "ornette" } },
                { apiVersion: "v1", kind: "Secret", metadata: { name: "stop", namespace: "jlh" }, data: { amor: "U3RvcA==" } },
                { apiVersion: "v1", kind: "Service", metadata: { name: "stop", namespace: "jlh" } },
                { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "scar", namespace: "scar" } },
                { apiVersion: "networking.k8s.io/v1", kind: "Ingress", metadata: { name: "stop", namespace: "jlh" } },
            ];
            assert.deepStrictEqual(specs, eSpecs);
        });

    });

});
