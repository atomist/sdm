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

import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { NodeFsLocalProject } from "@atomist/automation-client/lib/project/local/NodeFsLocalProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as k8s from "@kubernetes/client-node";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import * as assert from "power-assert";
import { DeepPartial } from "ts-essentials";
import { execPromise } from "../../../../lib/api-helper/misc/child_process";
import { CloningProjectLoader } from "../../../../lib/api-helper/project/cloningProjectLoader";
import { fakePush } from "../../../../lib/api-helper/testsupport/fakePush";
import { RepoContext } from "../../../../lib/api/context/SdmContext";
import { ExecuteGoalResult } from "../../../../lib/api/goal/ExecuteGoalResult";
import { GoalInvocation } from "../../../../lib/api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../lib/api/goal/SdmGoalEvent";
import {
    Container,
    ContainerInput,
    ContainerOutput,
    ContainerResult,
} from "../../../../lib/core/goal/container/container";
import {
    executeK8sJob,
    K8sContainerRegistration,
    k8sFulfillmentCallback,
} from "../../../../lib/core/goal/container/k8s";
import { loadKubeConfig } from "../../../../lib/core/pack/k8s/kubernetes/config";
import { KubernetesGoalScheduler } from "../../../../lib/core/pack/k8s/scheduler/KubernetesGoalScheduler";
import { SdmGoalState } from "../../../../lib/typings/types";
import { containerTestImage } from "./util";

/* tslint:disable:max-file-line-count */

describe("goal/container/k8s", () => {

    describe("k8sFulfillmentCallback", () => {

        let rac: any;
        let gcgpc: any;
        before(() => {
            rac = (global as any).__runningAutomationClient;
            (global as any).__runningAutomationClient = {
                configuration: {
                    name: "@zombies/care-of-cell-44",
                },
            };
            gcgpc = GitCommandGitProject.cloned;
            GitCommandGitProject.cloned = async () => InMemoryProject.of() as any;
        });
        after(() => {
            (global as any).__runningAutomationClient = rac;
            GitCommandGitProject.cloned = gcgpc;
        });

        const g: Container = new Container();
        const sge: SdmGoalEvent = {
            branch: "psychedelic-rock",
            goalSetId: "0abcdef-123456789-abcdef",
            id: "CHANGES",
            repo: {
                name: "odessey-and-oracle",
                owner: "TheZombies",
                providerId: "CBS",
            },
            sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
            uniqueName: "BeechwoodPark.ts#L243",
            push: {
                commits: [{
                    sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                }],
            },
        } as any;
        const kgs = new KubernetesGoalScheduler();
        kgs.podSpec = {
            spec: {
                containers: [
                    {
                        image: "rod/argent:1945.6.14",
                        name: "rod-argent",
                    },
                ],
            },
        } as any;
        const rc: RepoContext = {
            configuration: {
                apiKey: "AT0M15TAP1K3Y",
                sdm: {
                    projectLoader: CloningProjectLoader,
                    encryption: {
                        passphrase: "Od3553y",
                        privateKey: `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,ECAC148A43D19DB2

pZRWxykMr+lP2fmjFpwVjEvNFJPRWrUoTVbDDzoLZOjKRKZvO7dp90m3y5EzrWID
NLPNkMEhNKaLkdmEsQX3sO8FDuLDslfBvX8VIlgIIvL4etnwHnKHpcY4IBT+DcIL
f6m6fsBMzuX4OLMnODPI3sp3jK+R8VdXS7xfa/OIXeh9SHkp2sB78+6dUru4BUx2
rypdVq3tvLTB0ElQLd+9Y7ms6qoFYCJrigNk8TTEbcMZGxOWQ79L4xKoVp0zG/r4
M8CyM7evZ3QPoHWyTqAkU2S8rRDignl1C+giRYSaG9Uu2OoS9LV0BrjoSN5AgAfX
da1QLrPXMVmNADFqAdC78s+KBQEAvsyNAGHTA62eNjD3dGtKKZsvGamzQnEyl7Em
b4uN5MuNdB1CBM7lQz1m9oOegrWom26zrCEE2Pf+fo39N8LHdACuZTpZYzoZe43j
Ms6YqD6EHTE1zx8pc3yCcmSUtU2ch+UCcPOXVLb/mxffIeHaOLikzerAF4iG9Gee
OMNQvk4nUXSRQilUgEaII+QTx+GEpPtCef8ioS1hx/37tkpsIB24suISNp6vRB+4
jZHlRF+aCel80YIqKwJR4LfZvMXiEJERbN5uxqTHCwXoCU+e+Bv7SP1jMOYpvEIL
hseGAriQ9i4cJVO7R46IYUwsKcGpr61Uax3rbjlITSusct8JptWsTob7Z/gy8P9F
eascXJ5Ii8fMzcDTxQW1CNEOid/WQdEQFLMZSacCpUi3nKzN/JdPdigC7yqOa6Cf
QAdB/khyrF/0t9BmzJlfsFm8D2cXaN+rls3TPiKkfDSXAchcIPJSDZ5ky85Sp4c+
1m5kgBvTBS560WdAw6UvTvhJTfPCP3f+27ChXXduAeVt3aDyrOqcoT9KPw+NNpOH
aph9L6+nIVF+kqX1kOLg5Shp+uGRqlwi5An7X0C4rIOXTX5LvV1zJ4x3u45xlLuw
ONGxLB31Hy94q2LmZqtIaekdN635yrO/FUUTBwTnI0xE291g0DowhxzN98l0VKWv
dDpSFZhfN5nZPELLRXaMQLKsEOQTk5PVWycU+CxKJ1xB47pts+3zhuu14Aj87bBj
Ja2GlWEEa2m6K6plaGRnBFRvP07QPSnoagiMJJ6rA5FlWSvHXWIxVQt99RzLhmeU
uHVuUuNxWnZ0dFMZvYGefKEjD/wPrqqCFYQoxCknpzyvEfHEulTcEu1u+4vNA6p7
ulG/ku7JhZU1CYkbl83G7zju81dKYS4hSZE1E/VEJtRCN93r9YpyTO24yxELMemN
4hT8vwn4e/SvME16kxFzZYl+0dltxH4rqvZ9Phpap7LYRbjZYuBBxqO/FC6DvLyj
RGe/Na+6E7hFNv+ibghbFhXuYfbnmXx/1rGZwuNZu01W1R3RUUfSvChL6ffyo26n
qLiXI8YeIzmpKgwXXNLIpUEAo/ZX+kMxvJpLiLKxfJ0og7XcYvFAKsMZbc8lyEv4
dGe21S9sMOqyEp9D8geeXkg3VAItxuXbLIBfKL45kwSvB6fEFtQnJEOrT4YXSRDY
6ba7erlpdnnwr1Xl7R+DC1BVYVW7SyuXn2jIZBoA27reQzZyjCrlHw==
-----END RSA PRIVATE KEY-----
`,
                    },
                    goalScheduler: [kgs],
                },
            },
            context: {
                context: {
                    workspaceName: "Odessey and Oracle",
                },
                correlationId: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                graphClient: {
                    query: async () => ({ SdmVersion: [{ version: "1968.4.19" }] }),
                },
                workspaceId: "AR05343M1LY",
            },
            credentials: { token: "5cmT0k3nC43d3nt145" },
        } as any;

        it("should add k8s service to goal event data", async () => {
            const r: K8sContainerRegistration = {
                containers: [
                    {
                        args: ["true"],
                        image: "colin/blunstone:1945.6.24",
                        name: "colin-blunstone",
                    },
                ],
                name: "MaybeAfterHesGone",
            };
            const c = k8sFulfillmentCallback(g, r);
            const ge = await c(sge, rc);
            const p = JSON.parse(ge.data);
            const v: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[0].name`);
            const iv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[1].name`);
            const ov: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[2].name`);
            assert(v, "failed to find volume name");
            assert(iv, "failed to find volume name");
            assert(ov, "failed to find volume name");
            assert(v.startsWith("project-"));
            assert(iv.startsWith("input-"));
            assert(ov.startsWith("output-"));
            const i: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.initContainer[0].name`);
            assert(i, "failed to find initContainer name");
            assert(i.startsWith("container-goal-init-"));
            const d = {
                "@atomist/sdm/service": {
                    MaybeAfterHesGone: {
                        type: "@atomist/sdm/service/k8s",
                        spec: {
                            initContainer: [
                                {
                                    env: [
                                        {
                                            name: "ATOMIST_JOB_NAME",
                                            value: "rod-argent-job-0abcdef-beechwoodpark.ts",
                                        },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: `@zombies/care-of-cell-44-job-0abcdef-beechwoodpark.ts`,
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM_NAME",
                                            value: "Odessey and Oracle",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_ID",
                                            value: "CHANGES",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SET_ID",
                                            value: "0abcdef-123456789-abcdef",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_UNIQUE_NAME",
                                            value: "BeechwoodPark.ts#L243",
                                        },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL_INIT",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_CONFIG",
                                            value: "{\"cluster\":{\"enabled\":false},\"ws\":{\"enabled\":false}}",
                                        },
                                    ],
                                    image: "rod/argent:1945.6.14",
                                    name: i,
                                },
                            ],
                            container: [
                                {
                                    args: ["true"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                    ],
                                    image: "colin/blunstone:1945.6.24",
                                    name: "colin-blunstone",
                                    workingDir: "/atm/home",
                                },
                            ],
                            volume: [
                                {
                                    name: v,
                                    emptyDir: {},
                                },
                                {
                                    name: iv,
                                    emptyDir: {},
                                },
                                {
                                    name: ov,
                                    emptyDir: {},
                                },
                            ],
                            volumeMount: [
                                {
                                    mountPath: "/atm/home",
                                    name: v,
                                },
                                {
                                    mountPath: ContainerInput,
                                    name: iv,
                                },
                                {
                                    mountPath: ContainerOutput,
                                    name: ov,
                                },
                            ],
                        },
                    },
                },
            };
            delete p["@atomist/sdm/container"];
            assert.deepStrictEqual(p, d);
            delete ge.data;
            const e = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
                push: {
                    after: {
                        version: "1968.4.19",
                    },
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            assert.deepStrictEqual(ge, e);
        });

        it("should throw an error if there are no containers", async () => {
            const r: K8sContainerRegistration = {
                containers: [],
            };
            const c = k8sFulfillmentCallback(g, r);
            try {
                await c(sge, rc);
                assert.fail("callback should have thrown an error");
            } catch (e) {
                assert(/No containers defined in K8sGoalContainerSpec/.test(e.message));
            }
        });

        it("should not set the working directory in the main container", async () => {
            const r: K8sContainerRegistration = {
                containers: [
                    {
                        args: ["true"],
                        image: "colin/blunstone:1945.6.24",
                        name: "colin-blunstone",
                        workingDir: "",
                    },
                ],
                name: "MaybeAfterHesGone",
            };
            const c = k8sFulfillmentCallback(g, r);
            const ge = await c(sge, rc);
            const p = JSON.parse(ge.data);
            const v: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[0].name`);
            const iv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[1].name`);
            const ov: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[2].name`);
            assert(v, "failed to find volume name");
            assert(iv, "failed to find volume name");
            assert(ov, "failed to find volume name");
            assert(v.startsWith("project-"));
            assert(iv.startsWith("input-"));
            assert(ov.startsWith("output-"));
            const i: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.initContainer[0].name`);
            assert(i, "failed to find initContainer name");
            assert(i.startsWith("container-goal-init-"));
            const d = {
                "@atomist/sdm/service": {
                    MaybeAfterHesGone: {
                        type: "@atomist/sdm/service/k8s",
                        spec: {
                            initContainer: [
                                {
                                    env: [
                                        {
                                            name: "ATOMIST_JOB_NAME",
                                            value: "rod-argent-job-0abcdef-beechwoodpark.ts",
                                        },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: `@zombies/care-of-cell-44-job-0abcdef-beechwoodpark.ts`,
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM_NAME",
                                            value: "Odessey and Oracle",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_ID",
                                            value: "CHANGES",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SET_ID",
                                            value: "0abcdef-123456789-abcdef",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_UNIQUE_NAME",
                                            value: "BeechwoodPark.ts#L243",
                                        },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL_INIT",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_CONFIG",
                                            value: "{\"cluster\":{\"enabled\":false},\"ws\":{\"enabled\":false}}",
                                        },
                                    ],
                                    name: i,
                                    image: "rod/argent:1945.6.14",
                                },
                            ],
                            container: [
                                {
                                    args: ["true"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                    ],
                                    image: "colin/blunstone:1945.6.24",
                                    name: "colin-blunstone",
                                },
                            ],
                            volume: [
                                {
                                    name: v,
                                    emptyDir: {},
                                },
                                {
                                    name: iv,
                                    emptyDir: {},
                                },
                                {
                                    name: ov,
                                    emptyDir: {},
                                },
                            ],
                            volumeMount: [
                                {
                                    mountPath: "/atm/home",
                                    name: v,
                                },
                                {
                                    mountPath: ContainerInput,
                                    name: iv,
                                },
                                {
                                    mountPath: ContainerOutput,
                                    name: ov,
                                },
                            ],
                        },
                    },
                },
            };
            delete p["@atomist/sdm/container"];
            assert.deepStrictEqual(p, d);
            delete ge.data;
            const e = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
                push: {
                    after: {
                        version: "1968.4.19",
                    },
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            assert.deepStrictEqual(ge, e);
        });

        it("should merge k8s service into registration and use callback", async () => {
            const r: K8sContainerRegistration = {
                callback: async () => {
                    return {
                        containers: [
                            {
                                args: ["first"],
                                env: [
                                    {
                                        name: "GENRE",
                                        value: "Baroque pop",
                                    },
                                    {
                                        name: "STUDIO",
                                        value: "Abbey Road",
                                    },
                                ],
                                image: "colin/blunstone:1945.6.24",
                                name: "colin-blunstone",
                                volumeMounts: [
                                    {
                                        mountPath: "/willy",
                                        name: "tempest",
                                    },
                                ],
                                workingDir: "/abbey/road",
                            },
                            {
                                args: ["second"],
                                env: [
                                    {
                                        name: "INSTRUMENT",
                                        value: "Bass",
                                    },
                                ],
                                image: "chris/white:1943.3.7",
                                name: "chris-white",
                                volumeMounts: [
                                    {
                                        mountPath: "/bill",
                                        name: "tempest",
                                    },
                                ],
                            },
                        ],
                    };
                },
                containers: [],
                volumes: [
                    {
                        hostPath: {
                            path: "/william/shakespeare",
                        },
                        name: "tempest",
                    },
                ],
                name: "MaybeAfterHesGone",
            };
            const c = k8sFulfillmentCallback(g, r);
            const ge = await c(sge, rc);
            const p = JSON.parse(ge.data);
            const v: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[0].name`);
            const iv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[1].name`);
            const ov: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[2].name`);
            assert(v, "failed to find volume name");
            assert(iv, "failed to find volume name");
            assert(ov, "failed to find volume name");
            assert(v.startsWith("project-"));
            assert(iv.startsWith("input-"));
            assert(ov.startsWith("output-"));
            const i: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.initContainer[0].name`);
            assert(i, "failed to find initContainer name");
            assert(i.startsWith("container-goal-init-"));
            const d = {
                "@atomist/sdm/service": {
                    MaybeAfterHesGone: {
                        type: "@atomist/sdm/service/k8s",
                        spec: {
                            initContainer: [
                                {
                                    env: [
                                        {
                                            name: "ATOMIST_JOB_NAME",
                                            value: "rod-argent-job-0abcdef-beechwoodpark.ts",
                                        },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: `@zombies/care-of-cell-44-job-0abcdef-beechwoodpark.ts`,
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM_NAME",
                                            value: "Odessey and Oracle",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_ID",
                                            value: "CHANGES",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SET_ID",
                                            value: "0abcdef-123456789-abcdef",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_UNIQUE_NAME",
                                            value: "BeechwoodPark.ts#L243",
                                        },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL_INIT",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_CONFIG",
                                            value: "{\"cluster\":{\"enabled\":false},\"ws\":{\"enabled\":false}}",
                                        },
                                    ],
                                    image: "rod/argent:1945.6.14",
                                    name: i,
                                },
                            ],
                            container: [
                                {
                                    args: ["first"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "GENRE",
                                            value: "Baroque pop",
                                        },
                                        {
                                            name: "STUDIO",
                                            value: "Abbey Road",
                                        },
                                    ],
                                    image: "colin/blunstone:1945.6.24",
                                    name: "colin-blunstone",
                                    volumeMounts: [
                                        {
                                            mountPath: "/willy",
                                            name: "tempest",
                                        },
                                    ],
                                    workingDir: "/abbey/road",
                                },
                                {
                                    args: ["second"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "INSTRUMENT",
                                            value: "Bass",
                                        },
                                    ],
                                    image: "chris/white:1943.3.7",
                                    name: "chris-white",
                                    volumeMounts: [
                                        {
                                            mountPath: "/bill",
                                            name: "tempest",
                                        },
                                    ],
                                },
                            ],
                            volume: [
                                {
                                    name: v,
                                    emptyDir: {},
                                },
                                {
                                    name: iv,
                                    emptyDir: {},
                                },
                                {
                                    name: ov,
                                    emptyDir: {},
                                },
                                {
                                    hostPath: {
                                        path: "/william/shakespeare",
                                    },
                                    name: "tempest",
                                },
                            ],
                            volumeMount: [
                                {
                                    mountPath: "/atm/home",
                                    name: v,
                                },
                                {
                                    mountPath: ContainerInput,
                                    name: iv,
                                },
                                {
                                    mountPath: ContainerOutput,
                                    name: ov,
                                },
                            ],
                        },
                    },
                },
            };
            delete p["@atomist/sdm/container"];
            assert.deepStrictEqual(p, d);
            delete ge.data;
            const e = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
                push: {
                    after: {
                        version: "1968.4.19",
                    },
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            assert.deepStrictEqual(ge, e);
        });

        it("should add scheduler pod spec envs and volumeMounts to init container", async () => {
            const kgsx = new KubernetesGoalScheduler();
            kgsx.podSpec = {
                spec: {
                    containers: [
                        {
                            env: [
                                {
                                    name: "ATOMIST_CONFIG_PATH",
                                    value: "/opt/atm/client.config.json",
                                },
                            ],
                            image: "rod/argent:1945.6.14",
                            livenessProbe: {
                                httpGet: {
                                    path: "/health",
                                    port: "http",
                                },
                                initialDelaySeconds: 20,
                            },
                            name: "rod-argent",
                            volumeMounts: [
                                {
                                    mountPath: "/opt/atm",
                                    name: "sdm-config",
                                },
                            ],
                        },
                    ],
                },
            } as any;
            const rcx: RepoContext = {
                configuration: {
                    sdm: {
                        goalScheduler: [kgsx],
                    },
                },
                context: {
                    context: {
                        workspaceName: "Odessey and Oracle",
                    },
                    correlationId: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                    graphClient: {
                        query: async () => ({ SdmVersion: [{ version: "1968.4.19" }] }),
                    },
                    workspaceId: "AR05343M1LY",
                },
            } as any;
            const r: K8sContainerRegistration = {
                containers: [
                    {
                        args: ["true"],
                        image: "colin/blunstone:1945.6.24",
                        name: "colin-blunstone",
                    },
                ],
                initContainers: [
                    {
                        args: ["/bin/sh", "-c", "echo 'hello'"],
                        image: "rod/argent:latest",
                        name: "init-rod-argent",
                    },
                ],
                name: "MaybeAfterHesGone",
            };
            const c = k8sFulfillmentCallback(g, r);
            const ge = await c(sge, rcx);
            const p = JSON.parse(ge.data);
            const v: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[0].name`);
            const iv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[1].name`);
            const ov: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[2].name`);
            assert(v, "failed to find volume name");
            assert(iv, "failed to find volume name");
            assert(ov, "failed to find volume name");
            assert(v.startsWith("project-"));
            assert(iv.startsWith("input-"));
            assert(ov.startsWith("output-"));
            const i: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.initContainer[0].name`);
            assert(i, "failed to find initContainer name");
            assert(i.startsWith("container-goal-init-"));
            const d = {
                "@atomist/sdm/service": {
                    MaybeAfterHesGone: {
                        type: "@atomist/sdm/service/k8s",
                        spec: {
                            initContainer: [
                                {
                                    env: [
                                        {
                                            name: "ATOMIST_CONFIG_PATH",
                                            value: "/opt/atm/client.config.json",
                                        },
                                        {
                                            name: "ATOMIST_JOB_NAME",
                                            value: "rod-argent-job-0abcdef-beechwoodpark.ts",
                                        },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: `@zombies/care-of-cell-44-job-0abcdef-beechwoodpark.ts`,
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM_NAME",
                                            value: "Odessey and Oracle",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_ID",
                                            value: "CHANGES",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SET_ID",
                                            value: "0abcdef-123456789-abcdef",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_UNIQUE_NAME",
                                            value: "BeechwoodPark.ts#L243",
                                        },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL_INIT",
                                            value: "true",
                                        },
                                        {
                                            name: "ATOMIST_CONFIG",
                                            value: "{\"cluster\":{\"enabled\":false},\"ws\":{\"enabled\":false}}",
                                        },
                                    ],
                                    name: i,
                                    image: "rod/argent:1945.6.14",
                                    volumeMounts: [
                                        {
                                            mountPath: "/opt/atm",
                                            name: "sdm-config",
                                        },
                                    ],
                                },
                                {
                                    args: ["/bin/sh", "-c", "echo 'hello'"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                    ],
                                    image: "rod/argent:latest",
                                    name: "init-rod-argent",
                                },
                            ],
                            container: [
                                {
                                    args: ["true"],
                                    env: [
                                        {
                                            name: "ATOMIST_WORKSPACE_ID",
                                            value: "AR05343M1LY",
                                        },
                                        {
                                            name: "ATOMIST_SLUG",
                                            value: "TheZombies/odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_OWNER",
                                            value: "TheZombies",
                                        },
                                        {
                                            name: "ATOMIST_REPO",
                                            value: "odessey-and-oracle",
                                        },
                                        {
                                            name: "ATOMIST_SHA",
                                            value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                                        },
                                        {
                                            name: "ATOMIST_BRANCH",
                                            value: "psychedelic-rock",
                                        },
                                        {
                                            name: "ATOMIST_VERSION",
                                            value: "1968.4.19",
                                        },
                                        {
                                            name: "ATOMIST_GOAL",
                                            value: `${ContainerInput}/goal.json`,
                                        },
                                        {
                                            name: "ATOMIST_RESULT",
                                            value: ContainerResult,
                                        },
                                        {
                                            name: "ATOMIST_INPUT_DIR",
                                            value: ContainerInput,
                                        },
                                        {
                                            name: "ATOMIST_OUTPUT_DIR",
                                            value: ContainerOutput,
                                        },
                                        {
                                            name: "ATOMIST_PROJECT_DIR",
                                            value: "/atm/home",
                                        },
                                    ],
                                    image: "colin/blunstone:1945.6.24",
                                    name: "colin-blunstone",
                                    workingDir: "/atm/home",
                                },
                            ],
                            volume: [
                                {
                                    name: v,
                                    emptyDir: {},
                                },
                                {
                                    name: iv,
                                    emptyDir: {},
                                },
                                {
                                    name: ov,
                                    emptyDir: {},
                                },
                            ],
                            volumeMount: [
                                {
                                    mountPath: "/atm/home",
                                    name: v,
                                },
                                {
                                    mountPath: ContainerInput,
                                    name: iv,
                                },
                                {
                                    mountPath: ContainerOutput,
                                    name: ov,
                                },
                            ],
                        },
                    },
                },
            };
            delete p["@atomist/sdm/container"];
            assert.deepStrictEqual(p, d);
            delete ge.data;
            const e = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
                push: {
                    after: {
                        version: "1968.4.19",
                    },
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            assert.deepStrictEqual(ge, e);
        });

        it("should add secrets to k8s service goal event data", async () => {
            const r: K8sContainerRegistration = {
                containers: [
                    {
                        args: ["true"],
                        image: "colin/blunstone:1945.6.24",
                        name: "colin-blunstone",
                        secrets: {
                            env: [{ name: "SCM_TOKEN", value: { provider: { type: "scm" } } }],
                            fileMounts: [
                                { mountPath: "/opt/secret/api-key", value: { provider: { type: "atomist" } } },
                                // tslint:disable-next-line:max-line-length
                                {
                                    mountPath: "/opt/secret/something",
                                    value: { encrypted: "WJ6PcPgZUaDpZWn/J8asXS677ZOLgHGWcMqWtK16oi8UD6HuyGxUV1Vv24mZluReeklHLspDhacfRWNzmOVxGpEOupgJcuTaLMNfDT5F8drl4SIr2ENj2gvuBO2LfwDGAzAG+0ShyeY92SZK4UhBMdTgcrC+aUn980KlclnAeiUvGDQmGDyZ95eMTvxkHlQ9rakxW9A5aZoj/mVxdXjxq5ioTHu6LLKNBFG7nowFnrneNt+hHH97Gs+LdCnYtqvC8zkzyqlIjjQS3Mmqja9fhL9ToxFZyZy2ZCM0gwcnTHKKJ8GhYfLxAq2ZrDsyvAWOpEyXUuNuxJ5N0pUDUBufAQ==" },
                                },
                            ],
                        },
                    },
                    {
                        image: "mongo:latest",
                        name: "mongo",
                    },
                ],
                initContainers: [
                    {
                        args: ["/bin/sh", "-c", "echo 'hello'"],
                        image: "rod/argent:latest",
                        name: "init-rod-argent",
                        volumeMounts: [
                            { mountPath: "/bill/s", name: "tempest" },
                        ],
                    },
                ],
                name: "MaybeAfterHesGone",
                volumes: [
                    { hostPath: { path: "/william/shakespeare" }, name: "tempest" },
                ],
            };
            const c = k8sFulfillmentCallback(g, r);
            const ge = await c(sge, rc);
            const p = JSON.parse(ge.data);
            const v: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[0].name`);
            const iv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[1].name`);
            const ov: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[2].name`);
            const sv: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.volume[4].name`);
            assert(v, "failed to find volume name");
            assert(iv, "failed to find volume name");
            assert(ov, "failed to find volume name");
            assert(sv, "failed to find volume name");
            assert(v.startsWith("project-"));
            assert(iv.startsWith("input-"));
            assert(ov.startsWith("output-"));
            assert(sv.startsWith("secret-"));
            const i: string = _.get(p, `["@atomist/sdm/service"].MaybeAfterHesGone.spec.initContainer[0].name`);
            assert(i, "failed to find initContainer name");
            assert(i.startsWith("container-goal-init-"));
            const d = {
                "@atomist/sdm/service": {
                    MaybeAfterHesGone: {
                        type: "@atomist/sdm/service/k8s",
                        spec: {
                            initContainer: [
                                {
                                    env: [
                                        { name: "ATOMIST_JOB_NAME", value: "rod-argent-job-0abcdef-beechwoodpark.ts" },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: `@zombies/care-of-cell-44-job-0abcdef-beechwoodpark.ts`,
                                        },
                                        { name: "ATOMIST_GOAL_TEAM", value: "AR05343M1LY" },
                                        { name: "ATOMIST_GOAL_TEAM_NAME", value: "Odessey and Oracle" },
                                        { name: "ATOMIST_GOAL_ID", value: "CHANGES" },
                                        { name: "ATOMIST_GOAL_SET_ID", value: "0abcdef-123456789-abcdef" },
                                        { name: "ATOMIST_GOAL_UNIQUE_NAME", value: "BeechwoodPark.ts#L243" },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                                        },
                                        { name: "ATOMIST_ISOLATED_GOAL", value: "true" },
                                        { name: "ATOMIST_WORKSPACE_ID", value: "AR05343M1LY" },
                                        { name: "ATOMIST_SLUG", value: "TheZombies/odessey-and-oracle" },
                                        { name: "ATOMIST_OWNER", value: "TheZombies" },
                                        { name: "ATOMIST_REPO", value: "odessey-and-oracle" },
                                        { name: "ATOMIST_SHA", value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892" },
                                        { name: "ATOMIST_BRANCH", value: "psychedelic-rock" },
                                        { name: "ATOMIST_VERSION", value: "1968.4.19" },
                                        { name: "ATOMIST_GOAL", value: `${ContainerInput}/goal.json` },
                                        { name: "ATOMIST_RESULT", value: ContainerResult },
                                        { name: "ATOMIST_INPUT_DIR", value: ContainerInput },
                                        { name: "ATOMIST_OUTPUT_DIR", value: ContainerOutput },
                                        { name: "ATOMIST_PROJECT_DIR", value: "/atm/home" },
                                        { name: "ATOMIST_ISOLATED_GOAL_INIT", value: "true" },
                                        {
                                            name: "ATOMIST_CONFIG",
                                            value: "{\"cluster\":{\"enabled\":false},\"ws\":{\"enabled\":false}}",
                                        },
                                    ],
                                    image: "rod/argent:1945.6.14",
                                    name: i,
                                    volumeMounts: [
                                        { name: sv, mountPath: "/opt/secret" },
                                    ],
                                },
                                {
                                    args: ["/bin/sh", "-c", "echo 'hello'"],
                                    env: [
                                        { name: "SCM_TOKEN", value: "5cmT0k3nC43d3nt145" },
                                        { name: "ATOMIST_WORKSPACE_ID", value: "AR05343M1LY" },
                                        { name: "ATOMIST_SLUG", value: "TheZombies/odessey-and-oracle" },
                                        { name: "ATOMIST_OWNER", value: "TheZombies" },
                                        { name: "ATOMIST_REPO", value: "odessey-and-oracle" },
                                        { name: "ATOMIST_SHA", value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892" },
                                        { name: "ATOMIST_BRANCH", value: "psychedelic-rock" },
                                        { name: "ATOMIST_VERSION", value: "1968.4.19" },
                                        { name: "ATOMIST_GOAL", value: `${ContainerInput}/goal.json` },
                                        { name: "ATOMIST_RESULT", value: ContainerResult },
                                        { name: "ATOMIST_INPUT_DIR", value: ContainerInput },
                                        { name: "ATOMIST_OUTPUT_DIR", value: ContainerOutput },
                                        { name: "ATOMIST_PROJECT_DIR", value: "/atm/home" },
                                    ],
                                    image: "rod/argent:latest",
                                    name: "init-rod-argent",
                                    volumeMounts: [
                                        { mountPath: "/bill/s", name: "tempest" },
                                        { mountPath: "/opt/secret/api-key", name: sv, subPath: "api-key" },
                                        { mountPath: "/opt/secret/something", name: sv, subPath: "something" },
                                    ],
                                },
                            ],
                            container: [
                                {
                                    args: ["true"],
                                    env: [
                                        { name: "SCM_TOKEN", value: "5cmT0k3nC43d3nt145" },
                                        { name: "ATOMIST_WORKSPACE_ID", value: "AR05343M1LY" },
                                        { name: "ATOMIST_SLUG", value: "TheZombies/odessey-and-oracle" },
                                        { name: "ATOMIST_OWNER", value: "TheZombies" },
                                        { name: "ATOMIST_REPO", value: "odessey-and-oracle" },
                                        { name: "ATOMIST_SHA", value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892" },
                                        { name: "ATOMIST_BRANCH", value: "psychedelic-rock" },
                                        { name: "ATOMIST_VERSION", value: "1968.4.19" },
                                        { name: "ATOMIST_GOAL", value: `${ContainerInput}/goal.json` },
                                        { name: "ATOMIST_RESULT", value: ContainerResult },
                                        { name: "ATOMIST_INPUT_DIR", value: ContainerInput },
                                        { name: "ATOMIST_OUTPUT_DIR", value: ContainerOutput },
                                        { name: "ATOMIST_PROJECT_DIR", value: "/atm/home" },
                                    ],
                                    image: "colin/blunstone:1945.6.24",
                                    name: "colin-blunstone",
                                    volumeMounts: [
                                        { mountPath: "/opt/secret/api-key", name: sv, subPath: "api-key" },
                                        { mountPath: "/opt/secret/something", name: sv, subPath: "something" },
                                    ],
                                    workingDir: "/atm/home",
                                },
                                {
                                    env: [
                                        { name: "SCM_TOKEN", value: "5cmT0k3nC43d3nt145" },
                                        { name: "ATOMIST_WORKSPACE_ID", value: "AR05343M1LY" },
                                        { name: "ATOMIST_SLUG", value: "TheZombies/odessey-and-oracle" },
                                        { name: "ATOMIST_OWNER", value: "TheZombies" },
                                        { name: "ATOMIST_REPO", value: "odessey-and-oracle" },
                                        { name: "ATOMIST_SHA", value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892" },
                                        { name: "ATOMIST_BRANCH", value: "psychedelic-rock" },
                                        { name: "ATOMIST_VERSION", value: "1968.4.19" },
                                        { name: "ATOMIST_GOAL", value: `${ContainerInput}/goal.json` },
                                        { name: "ATOMIST_RESULT", value: ContainerResult },
                                        { name: "ATOMIST_INPUT_DIR", value: ContainerInput },
                                        { name: "ATOMIST_OUTPUT_DIR", value: ContainerOutput },
                                        { name: "ATOMIST_PROJECT_DIR", value: "/atm/home" },
                                    ],
                                    image: "mongo:latest",
                                    name: "mongo",
                                    volumeMounts: [
                                        { mountPath: "/opt/secret/api-key", name: sv, subPath: "api-key" },
                                        { mountPath: "/opt/secret/something", name: sv, subPath: "something" },
                                    ],
                                },
                            ],
                            volume: [
                                { name: v, emptyDir: {} },
                                { name: iv, emptyDir: {} },
                                { name: ov, emptyDir: {} },
                                { hostPath: { path: "/william/shakespeare" }, name: "tempest" },
                                { name: sv, emptyDir: {} },
                            ],
                            volumeMount: [
                                { mountPath: "/atm/home", name: v },
                                { mountPath: ContainerInput, name: iv },
                                { mountPath: ContainerOutput, name: ov },
                            ],
                        },
                    },
                },
            };
            delete p["@atomist/sdm/container"];
            assert.deepStrictEqual(p, d);
            delete ge.data;
            const e = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
                push: {
                    after: {
                        version: "1968.4.19",
                    },
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            assert.deepStrictEqual(ge, e);
        });

    });

    describe("executeK8sJob", () => {

        const fakeId = fakePush().id;
        const goal = new Container();
        const tmpDirPrefix = path.join(os.tmpdir(), "atomist-sdm-k8s-test");
        let project: GitProject;
        const tmpDirs: string[] = [];
        let logData = "";
        const goalInvocation: GoalInvocation = {
            context: {
                graphClient: {
                    query: () => ({ SdmVersion: [{ version: "3.1.3-20200220200220" }] }),
                },
            },
            configuration: {
                sdm: {
                    goal: {
                        timeout: 2000,
                    },
                    projectLoader: {
                        doWithProject: (o, a) => a(project),
                    },
                },
            },
            credentials: {},
            goalEvent: {
                branch: fakeId.branch,
                goalSetId: "27c20de4-2c88-480a-b4e7-f6c6d5a1d623",
                repo: {
                    name: fakeId.repo,
                    owner: fakeId.owner,
                    providerId: "album",
                },
                sha: fakeId.sha,
                uniqueName: goal.definition.uniqueName,
                push: {
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
                data: JSON.stringify({
                    "@atomist/sdm/container": {
                        containers: [
                            {
                                args: ["true"],
                                image: containerTestImage,
                                name: "alpine",
                            },
                        ],
                    },
                }),
            },
            id: fakeId,
            progressLog: {
                write: d => {
                    logData += d;
                },
            },
        } as any;

        let origProjectDir: string;
        before(() => {
            origProjectDir = process.env.ATOMIST_PROJECT_DIR;
        });

        beforeEach(async function resetFileSystem(): Promise<void> {
            logData = "";
            const projectDir = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(projectDir);
            tmpDirs.push(projectDir);
            project = await NodeFsLocalProject.fromExistingDirectory(fakeId, projectDir) as any;
            const workingDir = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(workingDir);
            tmpDirs.push(workingDir);
            process.env.ATOMIST_PROJECT_DIR = workingDir;

            const inputDir = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(inputDir);
            tmpDirs.push(inputDir);
            process.env.ATOMIST_INPUT_DIR = inputDir;
            const outputDir = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(outputDir);
            tmpDirs.push(outputDir);
            process.env.ATOMIST_OUTPUT_DIR = outputDir;
        });

        after(async function directoryCleanup(): Promise<void> {
            if (origProjectDir) {
                process.env.ATOMIST_PROJECT_DIR = origProjectDir;
            } else {
                delete process.env.ATOMIST_PROJECT_DIR;
            }
            delete process.env.ATOMIST_INPUT_DIR;
            delete process.env.ATOMIST_OUTPUT_DIR;
            await Promise.all(tmpDirs.map(d => fs.remove(d)));
        });

        it("should run in init mode", async () => {
            const e = executeK8sJob();
            const f = `JUNK-${guid()}.md`;
            const fp = path.join(project.baseDir, f);
            await fs.writeFile(fp, "Counting the days until they set you free again\n");
            const fw = path.join(process.env.ATOMIST_PROJECT_DIR, f);
            assert(!fs.existsSync(fw), `target file '${fw}' already exists`);
            process.env.ATOMIST_ISOLATED_GOAL_INIT = "true";
            const egr = await e(goalInvocation);
            delete process.env.ATOMIST_ISOLATED_GOAL_INIT;
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as SdmGoalEvent;
            const eg = {
                branch: fakeId.branch,
                goalSetId: "27c20de4-2c88-480a-b4e7-f6c6d5a1d623",
                repo: {
                    name: fakeId.repo,
                    owner: fakeId.owner,
                    providerId: "album",
                },
                sha: fakeId.sha,
                state: SdmGoalState.in_process,
                uniqueName: goal.definition.uniqueName,
                push: {
                    commits: [{
                        sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                    }],
                },
            };
            delete x.data;
            assert.deepStrictEqual(x, eg, logData);
            const ec = await fs.readFile(fp, "utf8");
            assert(ec === "Counting the days until they set you free again\n");
        }).timeout(10000);

        describe("minikube", () => {

            const ns = "default"; // readNamespace() is going to default to "default"
            const partialPodSpec: DeepPartial<k8s.V1Pod> = {
                apiVersion: "v1",
                kind: "Pod",
                metadata: {
                    namespace: ns,
                },
                spec: {
                    restartPolicy: "Never",
                    terminationGracePeriodSeconds: 0,
                },
            };
            const podNamePrefix = "sdm-container-k8s-test";

            let originalOsHostname: any;
            let k8sCore: k8s.CoreV1Api;
            before(async function minikubeCheckProjectSetup(this: Mocha.Context): Promise<void> {
                this.timeout(20000);
                try {
                    // see if minikube is available and responding
                    await execPromise("kubectl", ["config", "use-context", "minikube"]);
                    await execPromise("kubectl", ["get", "--request-timeout=200ms", "pods"]);
                    const kc = loadKubeConfig();
                    k8sCore = kc.makeApiClient(k8s.CoreV1Api);
                } catch (e) {
                    this.skip();
                }
                originalOsHostname = Object.getOwnPropertyDescriptor(os, "hostname");
            });

            beforeEach(() => {
                const podName = `${podNamePrefix}-${guid().split("-")[0]}`;
                partialPodSpec.metadata.name = podName;
                Object.defineProperty(os, "hostname", { value: () => podName });
            });

            after(() => {
                if (originalOsHostname) {
                    Object.defineProperty(os, "hostname", originalOsHostname);
                }
            });

            afterEach(() => {
                if (originalOsHostname) {
                    Object.defineProperty(os, "hostname", originalOsHostname);
                }
            });

            async function execK8sJobTest(r: K8sContainerRegistration): Promise<ExecuteGoalResult | void> {
                const p: k8s.V1Pod = _.merge({}, partialPodSpec, { spec: r });
                await k8sCore.createNamespacedPod(ns, p);
                goalInvocation.goalEvent.data = JSON.stringify({ "@atomist/sdm/container": r });
                const e = executeK8sJob();
                const egr = await e(goalInvocation);
                try {
                    const body: k8s.V1DeleteOptions = { gracePeriodSeconds: 0, propagationPolicy: "Background" };
                    await k8sCore.deleteNamespacedPod(p.metadata.name, ns, undefined, undefined, undefined, undefined, undefined, body);
                } catch (e) { /* ignore */ }
                return egr;
            }

            it("should report when the container succeeds", async () => {
                const r = {
                    containers: [
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 0, logData);
                assert(x.message === "Container 'alpine0' completed successfully");
            }).timeout(10000);

            it("should report when the container fails", async () => {
                const r = {
                    containers: [
                        {
                            args: ["false"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 1, logData);
                assert(x.message.startsWith("Container 'alpine0' failed:"));
            }).timeout(10000);

            it("should run multiple containers", async () => {
                const r = {
                    containers: [
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine1",
                        },
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine2",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 0);
                assert(x.message === "Container 'alpine0' completed successfully");
            }).timeout(10000);

            it("should report when main container fails", async () => {
                const r = {
                    containers: [
                        {
                            args: ["false"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine1",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 1);
                assert(x.message.startsWith("Container 'alpine0' failed:"));
            }).timeout(10000);

            it("should ignore when sidecar container fails", async () => {
                const r = {
                    containers: [
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                        {
                            args: ["false"],
                            image: containerTestImage,
                            name: "alpine1",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 0);
                assert(x.message === "Container 'alpine0' completed successfully");
            }).timeout(10000);

            it("should only wait on main container", async () => {
                const r = {
                    containers: [
                        {
                            args: ["true"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                        {
                            args: ["sleep", "20"],
                            image: containerTestImage,
                            name: "alpine1",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 0);
                assert(x.message === "Container 'alpine0' completed successfully");
            }).timeout(10000);

            it("should timeout", async () => {
                const r = {
                    containers: [
                        {
                            args: ["sleep", "20"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                        {
                            args: ["sleep", "20"],
                            image: containerTestImage,
                            name: "alpine1",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 1);
                assert(x.message === "Container 'alpine0' failed: Goal timeout '2000' exceeded");
            }).timeout(10000);

            it("should capture the container output in the log", async () => {
                const r = {
                    containers: [
                        {
                            args: [`echo "Wouldn't it be nice"; echo 'If we were older?'`],
                            command: ["sh", "-c"],
                            image: containerTestImage,
                            name: "alpine0",
                        },
                    ],
                };
                const egr = await execK8sJobTest(r);
                assert(egr, "ExecuteGoal did not return a value");
                const x = egr as ExecuteGoalResult;
                assert(x.code === 0, logData);
                assert(x.message === "Container 'alpine0' completed successfully");
                assert(logData.includes(`Wouldn't it be nice\nIf we were older?\n`));
            }).timeout(10000);

        });

    });

});
