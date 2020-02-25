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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as assert from "power-assert";
import { GoalInvocation } from "../../../../../lib/api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import {
    defaultImage,
    defaultKubernetesApplication,
    dockerPort,
    generateKubernetesGoalEventData,
    getKubernetesGoalEventData,
    repoSpecsKubernetsApplication,
} from "../../../../../lib/core/pack/k8s/deploy/data";
import {
    KubernetesDeploy,
    KubernetesDeployDataSources,
    KubernetesDeployRegistration,
} from "../../../../../lib/core/pack/k8s/deploy/goal";
import { KubernetesApplication } from "../../../../../lib/core/pack/k8s/kubernetes/request";

/* tslint:disable:max-file-line-count */

describe("pack/k8s/deploy/data", () => {

    describe("dockerPort", () => {

        it("should not find a port successfully", async () => {
            const p = InMemoryProject.of();
            const d = await dockerPort(p);
            assert(d === undefined);
        });

        it("should find a port successfully", async () => {
            const p = InMemoryProject.of({ path: "Dockerfile", content: "EXPOSE 80\n" });
            const d = await dockerPort(p);
            assert(d === 80);
        });

        it("should find a UDP port successfully", async () => {
            const p = InMemoryProject.of({ path: "Dockerfile", content: "EXPOSE 8080/udp\n" });
            const d = await dockerPort(p);
            assert(d === 8080);
        });

        it("should find first port successfully", async () => {
            const p = InMemoryProject.of({ path: "Dockerfile", content: "FROM ubuntu\nEXPOSE 8888/tcp 80/tcp\nENV BELIEVER=rhett\n" });
            const d = await dockerPort(p);
            assert(d === 8888);
        });

        it("should find first export port successfully", async () => {
            const p = InMemoryProject.of({ path: "Dockerfile", content: "FROM ubuntu\nEXPOSE 8888/tcp\nEXPOSE 80/tcp\nENV BELIEVER=rhett\n" });
            const d = await dockerPort(p);
            assert(d === 8888);
        });

    });

    describe("defaultImage", () => {

        it("should find after push image", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {
                        images: [{ imageName: "miller/rhett:instigator" }],
                    },
                },
            } as any;
            const k: KubernetesDeploy = {} as any;
            const c: HandlerContext = {} as any;
            const i = await defaultImage(e, k, c);
            assert(i === "miller/rhett:instigator");
        });

        it("should use the registry", async () => {
            const e: SdmGoalEvent = {
                branch: "dreamer",
                push: {
                    after: {},
                },
                repo: {
                    name: "believer",
                    owner: "rhettmiller",
                    providerId: "verve-forecast",
                },
                sha: "abcdef0123456789",
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        sdm: {
                            build: {
                                docker: {
                                    registry: "rhett.miller.com",
                                },
                            },
                        },
                    },
                },
            } as any;
            const c: HandlerContext = {} as any;
            const i = await defaultImage(e, k, c);
            assert(i === "rhett.miller.com/believer:latest");
        });

        it("should use the registry and clean repo name", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {},
                },
                repo: {
                    name: "-believer.",
                    owner: "rhettmiller",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        sdm: {
                            build: {
                                docker: {
                                    registry: "rhett.miller.com",
                                },
                            },
                        },
                    },
                },
            } as any;
            const c: HandlerContext = {} as any;
            const i = await defaultImage(e, k, c);
            assert(i === "rhett.miller.com/believer:latest");
        });

        it("should use the repo information and latest tag", async () => {
            const e: SdmGoalEvent = {
                branch: "dreamer",
                push: {
                    after: {},
                },
                repo: {
                    name: "dreamer",
                    owner: "rhettmiller",
                    providerId: "maximum-sunshine-records",
                },
                sha: "abcdef0123456789",
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {},
                },
            } as any;
            const c: HandlerContext = {} as any;
            const i = await defaultImage(e, k, c);
            assert(i === "rhettmiller/dreamer:latest");
        });

        it("should clean up the repo information", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {},
                },
                repo: {
                    name: "dreamer",
                    owner: "rhett-miller",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {},
                },
            } as any;
            const c: HandlerContext = {} as any;
            const i = await defaultImage(e, k, c);
            assert(i === "rhettmiller/dreamer:latest");
        });

    });

    describe("defaultKubernetesApplication", () => {

        it("should return default application data", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {},
                },
                repo: {
                    name: "new-york",
                    owner: "loureed",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        sdm: {},
                    },
                },
            } as any;
            const c: HandlerContext = { workspaceId: "L0UR33D" } as any;
            const d = await defaultKubernetesApplication(e, k, c);
            const r = {
                workspaceId: "L0UR33D",
                name: "new-york",
                image: "loureed/new-york:latest",
            };
            assert.deepStrictEqual(d, r);
        });

        it("should clean up repo name and org", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {},
                },
                repo: {
                    name: "new_york.",
                    owner: "lou-reed-",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        sdm: {},
                    },
                },
            } as any;
            const c: HandlerContext = { workspaceId: "L0UR33D" } as any;
            const d = await defaultKubernetesApplication(e, k, c);
            const r = {
                workspaceId: "L0UR33D",
                name: "new-york",
                image: "loureed/new_york:latest",
            };
            assert.deepStrictEqual(d, r);
        });

        it("should use linked image", async () => {
            const e: SdmGoalEvent = {
                push: {
                    after: {
                        images: [{ imageName: "docker.lou-reed.com/newyork:1989" }],
                    },
                },
                repo: {
                    name: "new-york",
                    owner: "loureed",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        sdm: {},
                    },
                },
            } as any;
            const c: HandlerContext = { workspaceId: "L0UR33D" } as any;
            const d = await defaultKubernetesApplication(e, k, c);
            const r = {
                workspaceId: "L0UR33D",
                name: "new-york",
                image: "docker.lou-reed.com/newyork:1989",
            };
            assert.deepStrictEqual(d, r);
        });

    });

    describe("repoSpecsKubernetesApplication", () => {

        it("should return all provided specs", async () => {
            const p: Project = InMemoryProject.of(
                { path: ".atomist/kubernetes/deployment.json", content: `{"spec":{"template":{"spec":{"terminationGracePeriodSeconds":7}}}}` },
                { path: ".atomist/kubernetes/service.yml", content: `spec:\n  metadata:\n    annotation:\n      halloween: parade\n` },
            );
            const r: KubernetesDeployRegistration = {
                dataSources: [
                    KubernetesDeployDataSources.DeploymentSpec,
                    KubernetesDeployDataSources.ServiceSpec,
                    KubernetesDeployDataSources.IngressSpec,
                    KubernetesDeployDataSources.RoleSpec,
                    KubernetesDeployDataSources.ServiceAccountSpec,
                    KubernetesDeployDataSources.RoleBindingSpec,
                ],
            };
            const d = await repoSpecsKubernetsApplication(p, r);
            const e = {
                deploymentSpec: {
                    spec: {
                        template: {
                            spec: {
                                terminationGracePeriodSeconds: 7,
                            },
                        },
                    },
                },
                serviceSpec: {
                    spec: {
                        metadata: {
                            annotation: {
                                halloween: "parade",
                            },
                        },
                    },
                },
                ingressSpec: undefined,
                roleSpec: undefined,
                serviceAccountSpec: undefined,
                roleBindingSpec: undefined,
            } as any;
            assert.deepStrictEqual(d, e);
        });

        it("should return no provided specs", async () => {
            const p: Project = InMemoryProject.of(
                { path: ".atomist/kubernetes/deployment.json", content: `{"spec":{"template":{"spec":{"terminationGracePeriodSeconds":7}}}}` },
                { path: ".atomist/kubernetes/service.yml", content: `spec:\n  metadata:\n    annotation:\n      halloween: parade\n` },
            );
            const r: KubernetesDeployRegistration = {
                dataSources: [],
            };
            const d = await repoSpecsKubernetsApplication(p, r);
            const e = {
                deploymentSpec: undefined,
                serviceSpec: undefined,
                ingressSpec: undefined,
                roleSpec: undefined,
                serviceAccountSpec: undefined,
                roleBindingSpec: undefined,
            } as any;
            assert.deepStrictEqual(d, e);
        });

        it("should return selected specs", async () => {
            const p: Project = InMemoryProject.of(
                { path: ".atomist/kubernetes/deployment.json", content: `{"spec":{"template":{"spec":{"terminationGracePeriodSeconds":7}}}}` },
                { path: ".atomist/kubernetes/service.yml", content: `spec:\n  metadata:\n    annotation:\n      halloween: parade\n` },
            );
            const r: KubernetesDeployRegistration = {
                dataSources: [
                    KubernetesDeployDataSources.IngressSpec,
                    KubernetesDeployDataSources.ServiceSpec,
                    KubernetesDeployDataSources.ServiceAccountSpec,
                ],
            };
            const d = await repoSpecsKubernetsApplication(p, r);
            const e = {
                deploymentSpec: undefined,
                serviceSpec: {
                    spec: {
                        metadata: {
                            annotation: {
                                halloween: "parade",
                            },
                        },
                    },
                },
                ingressSpec: undefined,
                roleSpec: undefined,
                serviceAccountSpec: undefined,
                roleBindingSpec: undefined,
            } as any;
            assert.deepStrictEqual(d, e);
        });

    });

    describe("generateKubernetesGoalEventData", () => {

        it("should return goal with data", async () => {
            const p: GitProject = InMemoryProject.of() as any;
            const g: GoalInvocation = {
                context: {
                    workspaceId: "L0UR33D",
                },
                goalEvent: {
                    push: {
                        after: {},
                    },
                    repo: {
                        name: "new-york",
                        owner: "loureed",
                    },
                },
            } as any;
            const k: KubernetesDeploy = {
                details: {
                    environment: "NewYork",
                },
                sdm: {
                    configuration: {
                        sdm: {
                            projectLoader: {
                                doWithProject: (x: any, a: (gp: GitProject) => Promise<SdmGoalEvent>) => a(p),
                            },
                        },
                    },
                },
            } as any;
            const r: KubernetesDeployRegistration = { dataSources: [], name: "@warhol/vu" };
            const sge = await generateKubernetesGoalEventData(k, r, g);
            assert(Object.keys(sge).length === 4);
            assert.deepStrictEqual(sge.push, { after: {} });
            assert.deepStrictEqual(sge.repo, { name: "new-york", owner: "loureed" });
            assert.deepStrictEqual(sge.fulfillment, { method: "sdm", name: "kubernetes-deploy-fulfill", registration: "@warhol/vu" });
            assert(sge.data);
            const gd = JSON.parse(sge.data);
            const exp = {
                workspaceId: "L0UR33D",
                name: "new-york",
                ns: "default",
                image: "loureed/new-york:latest",
            };
            assert.deepStrictEqual(gd["@atomist/sdm-pack-k8s"], exp);
        });

        it("should return goal when data is guff", async () => {
            const p: GitProject = InMemoryProject.of() as any;
            const g: GoalInvocation = {
                context: {
                    workspaceId: "L0UR33D",
                },
                goalEvent: {
                    data: ["there", "is", "no", "time"],
                    push: {
                        after: {},
                    },
                    repo: {
                        name: "new-york",
                        owner: "loureed",
                    },
                },
            } as any;
            const k: KubernetesDeploy = {
                details: {
                    environment: "NewYork",
                },
                sdm: {
                    configuration: {
                        sdm: {
                            projectLoader: {
                                doWithProject: (x: any, a: (gp: GitProject) => Promise<SdmGoalEvent>) => a(p),
                            },
                        },
                    },
                },
            } as any;
            const r: KubernetesDeployRegistration = { dataSources: [], name: "@warhol/vu" };
            const sge = await generateKubernetesGoalEventData(k, r, g);
            assert(Object.keys(sge).length === 4);
            assert.deepStrictEqual(sge.push, { after: {} });
            assert.deepStrictEqual(sge.repo, { name: "new-york", owner: "loureed" });
            assert.deepStrictEqual(sge.fulfillment, { method: "sdm", name: "kubernetes-deploy-fulfill", registration: "@warhol/vu" });
            assert(sge.data);
            const gd = JSON.parse(sge.data);
            const exp = {
                workspaceId: "L0UR33D",
                name: "new-york",
                ns: "default",
                image: "loureed/new-york:latest",
            };
            assert.deepStrictEqual(gd["@atomist/sdm-pack-k8s"], exp);
        });

        it("should merge all provided data properly", async () => {
            const p: GitProject = InMemoryProject.of(
                {
                    path: ".atomist/kubernetes/deployment.json",
                    content: `{"spec":{"replicas":5,"template":{"spec":{"dnsPolicy":"None","terminationGracePeriodSeconds":7}}}}`,
                },
                { path: ".atomist/kubernetes/service.yml", content: `spec:\n  metadata:\n    annotation:\n      halloween: parade\n` },
                { path: ".atomist/kubernetes/ingress.yml", content: `spec:\n  metadata:\n    annotation:\n      halloween: parade\n` },
                { path: "Dockerfile", content: "EXPOSE 8080/udp\n" },
            ) as any;
            const g: GoalInvocation = {
                context: {
                    workspaceId: "L0UR33D",
                },
                goalEvent: {
                    branch: "rock",
                    data: JSON.stringify({
                        "Xmas": "in February",
                        "@atomist/sdm-pack-k8s": {
                            host: "sick.of.you",
                            path: "/hold/on",
                            replicas: 14,
                            deploymentSpec: {
                                spec: {
                                    template: {
                                        spec: {
                                            dnsPolicy: "Default",
                                        },
                                    },
                                },
                            },
                        },
                    }),
                    push: {
                        after: {
                            images: [{ imageName: "docker.lou-reed.com/newyork:1989" }],
                        },
                    },
                    repo: {
                        name: "new-york",
                        owner: "loureed",
                        providerId: "sire",
                    },
                    sha: "ca19881989",
                },
            } as any;
            const k: KubernetesDeploy = {
                sdm: {
                    configuration: {
                        environment: "NewYork",
                        sdm: {
                            docker: {
                                registry: "lou.reed.com",
                            },
                            k8s: {
                                app: {
                                    ns: "romeo-juliet",
                                    host: "dirty.blvd.org",
                                    tlsSecret: "star-blvd-org",
                                },
                            },
                            projectLoader: {
                                doWithProject: (x: any, a: (gp: GitProject) => Promise<SdmGoalEvent>) => a(p),
                            },
                        },
                    },
                },
            } as any;
            const r: KubernetesDeployRegistration = {
                applicationData: (ra: KubernetesApplication, rp: GitProject) => Promise.resolve({
                    ...ra,
                    replicas: 5640,
                    tlsSecret: "sickofyou",
                    deploymentSpec: {
                        ...ra.deploymentSpec,
                        spec: {
                            ...ra.deploymentSpec.spec,
                            replicas: 11,
                        },
                    },
                    roleSpec: {
                        rules: [
                            {
                                apiGroups: [""],
                                resources: ["services"],
                                verbs: ["get", "watch", "list"],
                            },
                        ],
                    },
                }),
                dataSources: [
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.SdmConfiguration,
                    KubernetesDeployDataSources.GoalEvent,
                    KubernetesDeployDataSources.DeploymentSpec,
                    KubernetesDeployDataSources.ServiceSpec,
                    KubernetesDeployDataSources.RoleSpec,
                    KubernetesDeployDataSources.ServiceAccountSpec,
                    KubernetesDeployDataSources.RoleBindingSpec,
                ],
                name: "@warhol/vu",
            };
            const sge = await generateKubernetesGoalEventData(k, r, g);
            assert(Object.keys(sge).length === 6);
            assert(sge.branch === "rock");
            assert(sge.sha === "ca19881989");
            assert.deepStrictEqual(sge.push, { after: { images: [{ imageName: "docker.lou-reed.com/newyork:1989" }] } });
            assert.deepStrictEqual(sge.repo, { name: "new-york", owner: "loureed", providerId: "sire" });
            assert.deepStrictEqual(sge.fulfillment, { method: "sdm", name: "kubernetes-deploy-fulfill", registration: "@warhol/vu" });
            assert(sge.data);
            const gd = JSON.parse(sge.data);
            assert(gd.Xmas === "in February");
            const exp = {
                workspaceId: "L0UR33D",
                host: "sick.of.you",
                name: "new-york",
                ns: "romeo-juliet",
                image: "docker.lou-reed.com/newyork:1989",
                path: "/hold/on",
                port: 8080,
                replicas: 5640,
                tlsSecret: "sickofyou",
                deploymentSpec: {
                    spec: {
                        replicas: 11,
                        template: {
                            spec: {
                                dnsPolicy: "Default",
                                terminationGracePeriodSeconds: 7,
                            },
                        },
                    },
                },
                serviceSpec: {
                    spec: {
                        metadata: {
                            annotation: {
                                halloween: "parade",
                            },
                        },
                    },
                },
                roleSpec: {
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                    ],
                },
            };
            assert.deepStrictEqual(gd["@atomist/sdm-pack-k8s"], exp);
        });

    });

    describe("getKubernetesGoalEventData", () => {

        it("should return undefined if no goal event", () => {
            const k = getKubernetesGoalEventData(undefined);
            assert(k === undefined);
        });

        it("should return undefined if no data", async () => {
            const g: SdmGoalEvent = {} as any;
            const k = getKubernetesGoalEventData(g);
            assert(k === undefined);
        });

        it("should return undefined if no kubernetes application", () => {
            const g: SdmGoalEvent = { data: "{}" } as any;
            const k = getKubernetesGoalEventData(g);
            assert(k === undefined);
        });

        it("should throw an exception if data cannot be parsed", () => {
            const g: SdmGoalEvent = { data: "}{" } as any;
            assert.throws(() => getKubernetesGoalEventData(g), /Failed to parse goal event data/);
        });

        it("should return application data", () => {
            const g: SdmGoalEvent = {
                data: `{"@atomist/sdm-pack-k8s":{"name":"nowhere-man","ns":"rubber-soul","workspaceId":"EM15TUD105"}}`,
            } as any;
            const k = getKubernetesGoalEventData(g);
            const e = {
                name: "nowhere-man",
                ns: "rubber-soul",
                workspaceId: "EM15TUD105",
            };
            assert.deepStrictEqual(k, e);
        });

    });

});
