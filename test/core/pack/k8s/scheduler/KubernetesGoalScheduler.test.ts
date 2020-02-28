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
import * as k8s from "@kubernetes/client-node";
import * as assert from "power-assert";
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import {
    createJobSpec,
    isConfiguredInEnv,
    k8sJobEnv,
    k8sJobName,
    killJobFilter,
    zombiePodFilter,
} from "../../../../../lib/core/pack/k8s/scheduler/KubernetesGoalScheduler";

/* tslint:disable:max-file-line-count */

describe("core/pack/k8s/scheduler/KubernetesGoalScheduler", () => {

    describe("isConfiguredInEnv", () => {

        let gEnvVar: string;
        let lEnvVar: string;

        beforeEach(() => {
            gEnvVar = process.env.ATOMIST_GOAL_SCHEDULER;
            delete process.env.ATOMIST_GOAL_SCHEDULER;
            lEnvVar = process.env.ATOMIST_GOAL_LAUNCHER;
            delete process.env.ATOMIST_GOAL_LAUNCHER;
        });

        afterEach(() => {
            process.env.ATOMIST_GOAL_SCHEDULER = gEnvVar;
            gEnvVar = undefined;
            process.env.ATOMIST_GOAL_LAUNCHER = lEnvVar;
            lEnvVar = undefined;
        });

        it("should detect missing value", () => {
            assert(!isConfiguredInEnv("kubernetes"));
        });

        it("should detect single string value", () => {
            process.env.ATOMIST_GOAL_SCHEDULER = "kubernetes";
            assert(isConfiguredInEnv("kubernetes"));
        });

        it("should detect multiple string value", () => {
            process.env.ATOMIST_GOAL_LAUNCHER = "kubernetes";
            assert(isConfiguredInEnv("kubernetes-all", "kubernetes"));
        });

        it("should detect single json string value", () => {
            process.env.ATOMIST_GOAL_SCHEDULER = "\"kubernetes\"";
            assert(isConfiguredInEnv("kubernetes-all", "kubernetes"));
        });

        it("should detect single json array string value", () => {
            process.env.ATOMIST_GOAL_LAUNCHER = "[\"kubernetes\"]";
            assert(isConfiguredInEnv("kubernetes-all", "kubernetes"));
        });

        it("should detect multiple json array string value", () => {
            process.env.ATOMIST_GOAL_SCHEDULER = "[\"kubernetes-all\", \"docker\"]";
            assert(isConfiguredInEnv("docker", "kubernetes"));
        });

    });

    describe("k8sJobName", () => {

        it("should return a job name", () => {
            const p: k8s.V1PodSpec = {
                containers: [
                    {
                        name: "wild-horses",
                    },
                ],
            } as any;
            const g: SdmGoalEvent = {
                goalSetId: "abcdef0-123456789-abcdef",
                uniqueName: "Sundown.ts#L74",
            } as any;
            const n = k8sJobName(p, g);
            const e = "wild-horses-job-abcdef0-sundown.ts";
            assert(n === e);
        });

        it("should truncate a long job name", () => {
            const p: k8s.V1PodSpec = {
                containers: [
                    {
                        name: "whos-gonna-ride-your-wild-horses",
                    },
                ],
            } as any;
            const g: SdmGoalEvent = {
                goalSetId: "abcdef0-123456789-abcdef",
                uniqueName: "SomewhereNorthOfNashville.ts#L74",
            } as any;
            const n = k8sJobName(p, g);
            const e = "whos-gonna-ride-your-wild-horses-job-abcdef0-somewherenorthofna";
            assert(n === e);
        });

        it("should safely truncate a long job name", () => {
            const p: k8s.V1PodSpec = {
                containers: [
                    {
                        name: "i-think-theyve-got-your-alias-youve-been-living-un",
                    },
                ],
            } as any;
            const g: SdmGoalEvent = {
                goalSetId: "abcdef0-123456789-abcdef",
                uniqueName: "SomewhereNorthOfNashville.ts#L74",
            } as any;
            const n = k8sJobName(p, g);
            const e = "i-think-theyve-got-your-alias-youve-been-living-un-job-abcdef0";
            assert(n === e);
        });

    });

    describe("k8sJobEnv", () => {

        let aci: any;
        before(() => {
            aci = (global as any).__runningAutomationClient;
            (global as any).__runningAutomationClient = {
                configuration: {
                    name: "@zombies/care-of-cell-44",
                },
            };
        });
        after(() => {
            (global as any).__runningAutomationClient = aci;
        });

        it("should produce a valid set of environment variables", () => {
            const p: k8s.V1PodSpec = {
                containers: [
                    {
                        name: "brief-candles",
                    },
                ],
            } as any;
            const g: SdmGoalEvent = {
                goalSetId: "0abcdef-123456789-abcdef",
                id: "CHANGES",
                uniqueName: "BeechwoodPark.ts#L243",
            } as any;
            const c: HandlerContext = {
                context: {
                    workspaceName: "Odessey and Oracle",
                },
                correlationId: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                workspaceId: "AR05343M1LY",
            } as any;
            const v = k8sJobEnv(p, g, c);
            const e = [
                {
                    name: "ATOMIST_JOB_NAME",
                    value: "brief-candles-job-0abcdef-beechwoodpark.ts",
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
            ];
            assert.deepStrictEqual(v, e);
        });

    });

    describe("createJobSpec", () => {

        let aci: any;
        before(() => {
            aci = (global as any).__runningAutomationClient;
            (global as any).__runningAutomationClient = {
                configuration: {
                    name: "@atomist/demo-sdm",
                },
            };
        });
        after(() => {
            (global as any).__runningAutomationClient = aci;
        });

        it("should create a job spec", () => {
            /* tslint:disable:no-null-keyword */
            const p: k8s.V1PodSpec = {
                affinity: {
                    nodeAffinity: {
                        requiredDuringSchedulingIgnoredDuringExecution: {
                            nodeSelectorTerms: [
                                {
                                    matchExpressions: [
                                        {
                                            key: "sandbox.gke.io/runtime",
                                            operator: "In",
                                            values: [
                                                "gvisor",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                containers: [
                    {
                        env: [
                            {
                                name: "ATOMIST_CONFIG_PATH",
                                value: "/opt/atm/client.config.json",
                            },
                            {
                                name: "ATOMIST_GOAL_SCHEDULER",
                                value: "kubernetes",
                            },
                            {
                                name: "HOME",
                                value: "/home/atomist",
                            },
                            {
                                name: "TMPDIR",
                                value: "/tmp",
                            },
                        ],
                        image: "atomist/demo-sdm:1.0.0-master.20191216211453",
                        imagePullPolicy: "IfNotPresent",
                        livenessProbe: {
                            failureThreshold: 3,
                            httpGet: {
                                path: "/health",
                                port: "http" as unknown as object,
                                scheme: "HTTP",
                            },
                            initialDelaySeconds: 20,
                            periodSeconds: 10,
                            successThreshold: 1,
                            timeoutSeconds: 1,
                        },
                        name: "demo-sdm",
                        ports: [
                            {
                                containerPort: 2866,
                                name: "http",
                                protocol: "TCP",
                            },
                        ],
                        readinessProbe: {
                            failureThreshold: 3,
                            httpGet: {
                                path: "/health",
                                port: "http" as unknown as object,
                                scheme: "HTTP",
                            },
                            initialDelaySeconds: 20,
                            periodSeconds: 10,
                            successThreshold: 1,
                            timeoutSeconds: 1,
                        },
                        resources: {
                            limits: {
                                cpu: "1",
                                memory: "2Gi",
                            },
                            requests: {
                                cpu: "500m",
                                memory: "1Gi",
                            },
                        },
                        securityContext: {
                            allowPrivilegeEscalation: false,
                            privileged: false,
                            readOnlyRootFilesystem: true,
                            runAsGroup: 2866,
                            runAsNonRoot: true,
                            runAsUser: 2866,
                        },
                        terminationMessagePath: "/dev/termination-log",
                        terminationMessagePolicy: "File",
                        volumeMounts: [
                            {
                                mountPath: "/home/atomist",
                                name: "atomist-home",
                            },
                            {
                                mountPath: "/opt/atm",
                                name: "demo-sdm",
                                readOnly: true,
                            },
                            {
                                mountPath: "/tmp",
                                name: "sdm-tmp",
                            },
                            {
                                mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
                                name: "demo-sdm-token-vkrr4",
                                readOnly: true,
                            },
                        ],
                    },
                ],
                dnsPolicy: "ClusterFirst",
                enableServiceLinks: true,
                initContainers: [
                    {
                        args: [
                            "git config --global user.email 'bot@atomist.com' \u0026\u0026 git config --global user.name 'Atomist Bot'",
                        ],
                        command: [
                            "/bin/sh",
                            "-c",
                        ],
                        env: [
                            {
                                name: "HOME",
                                value: "/home/atomist",
                            },
                        ],
                        image: "atomist/sdm-base:0.4.0-20191204153918",
                        imagePullPolicy: "IfNotPresent",
                        name: "atomist-home-git",
                        resources: {},
                        securityContext: {
                            allowPrivilegeEscalation: false,
                            privileged: false,
                            readOnlyRootFilesystem: true,
                            runAsGroup: 2866,
                            runAsNonRoot: true,
                            runAsUser: 2866,
                        },
                        terminationMessagePath: "/dev/termination-log",
                        terminationMessagePolicy: "File",
                        volumeMounts: [
                            {
                                mountPath: "/home/atomist",
                                name: "atomist-home",
                            },
                            {
                                mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
                                name: "demo-sdm-token-vkrr4",
                                readOnly: true,
                            },
                        ],
                    },
                ],
                nodeName: "gke-k8-int-demo-wi-gvisor-pool-1-f54fa5e3-tc7n",
                priority: 0,
                restartPolicy: "Always",
                runtimeClassName: "gvisor",
                schedulerName: "default-scheduler",
                securityContext: {
                    fsGroup: 2866,
                },
                serviceAccount: "demo-sdm",
                serviceAccountName: "demo-sdm",
                terminationGracePeriodSeconds: 30,
                tolerations: [
                    {
                        effect: "NoSchedule",
                        key: "sandbox.gke.io/runtime",
                        operator: "Equal",
                        value: "gvisor",
                    },
                    {
                        effect: "NoExecute",
                        key: "node.kubernetes.io/not-ready",
                        operator: "Exists",
                        tolerationSeconds: 300,
                    },
                    {
                        effect: "NoExecute",
                        key: "node.kubernetes.io/unreachable",
                        operator: "Exists",
                        tolerationSeconds: 300,
                    },
                ],
                volumes: [
                    {
                        name: "demo-sdm",
                        secret: {
                            defaultMode: 288,
                            secretName: "demo-sdm",
                        },
                    },
                    {
                        emptyDir: {},
                        name: "atomist-home",
                    },
                    {
                        emptyDir: {},
                        name: "sdm-tmp",
                    },
                    {
                        name: "demo-sdm-token-vkrr4",
                        secret: {
                            defaultMode: 420,
                            secretName: "demo-sdm-token-vkrr4",
                        },
                    },
                ],
            };
            /* tslint:enable:no-null-keyword */
            const n = "sdm";
            const g: any = {
                configuration: {
                    name: "@atomist/demo-sdm",
                    version: "1.0.0-master.20191216211453",
                },
                context: {
                    context: {
                        workspaceName: "atomist-playground",
                    },
                    correlationId: "6757edf5-a95b-4948-8dd2-dc9fd935509f",
                    workspaceId: "T7GMF5USG",
                },
                goalEvent: {
                    goalSetId: "3bd7f5e0-f504-482c-8498-fd2e1c0492c2",
                    id: "258087f6-9130-556f-9572-c82981b6169e",
                    uniqueName: "container-maven-build#container.ts:64",
                },
            };
            const j = createJobSpec(p, n, g);
            const e = {
                apiVersion: "batch/v1",
                kind: "Job",
                metadata: {
                    annotations: {
                        "atomist.com/sdm": "{\"sdm\":{\"name\":\"@atomist/demo-sdm\",\"version\":\"1.0.0-master.20191216211453\"},\"goal\":{\"goalId\":\"258087f6-9130-556f-9572-c82981b6169e\",\"goalSetId\":\"3bd7f5e0-f504-482c-8498-fd2e1c0492c2\",\"uniqueName\":\"container-maven-build#container.ts:64\"}}",
                    },
                    labels: {
                        "atomist.com/creator": "atomist.demo-sdm",
                        "atomist.com/goal-id": "258087f6-9130-556f-9572-c82981b6169e",
                        "atomist.com/goal-set-id": "3bd7f5e0-f504-482c-8498-fd2e1c0492c2",
                        "atomist.com/workspace-id": "T7GMF5USG",
                    },
                    name: "demo-sdm-job-3bd7f5e-container-maven-build",
                    namespace: "sdm",
                },
                spec: {
                    backoffLimit: 0,
                    template: {
                        metadata: {
                            labels: {
                                "atomist.com/creator": "atomist.demo-sdm",
                                "atomist.com/goal-id": "258087f6-9130-556f-9572-c82981b6169e",
                                "atomist.com/goal-set-id": "3bd7f5e0-f504-482c-8498-fd2e1c0492c2",
                                "atomist.com/workspace-id": "T7GMF5USG",
                            },
                        },
                        spec: {
                            affinity: {
                                nodeAffinity: {
                                    requiredDuringSchedulingIgnoredDuringExecution: {
                                        nodeSelectorTerms: [
                                            {
                                                matchExpressions: [
                                                    {
                                                        key: "sandbox.gke.io/runtime",
                                                        operator: "In",
                                                        values: [
                                                            "gvisor",
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                                podAffinity: {
                                    preferredDuringSchedulingIgnoredDuringExecution: [
                                        {
                                            podAffinityTerm: {
                                                labelSelector: {
                                                    matchExpressions: [
                                                        {
                                                            key: "atomist.com/goal-set-id",
                                                            operator: "In",
                                                            values: [
                                                                "3bd7f5e0-f504-482c-8498-fd2e1c0492c2",
                                                            ],
                                                        },
                                                    ],
                                                },
                                                topologyKey: "kubernetes.io/hostname",
                                            },
                                            weight: 100,
                                        },
                                    ],
                                },
                            },
                            containers: [
                                {
                                    env: [
                                        {
                                            name: "ATOMIST_CONFIG_PATH",
                                            value: "/opt/atm/client.config.json",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SCHEDULER",
                                            value: "kubernetes",
                                        },
                                        {
                                            name: "HOME",
                                            value: "/home/atomist",
                                        },
                                        {
                                            name: "TMPDIR",
                                            value: "/tmp",
                                        },
                                        {
                                            name: "ATOMIST_JOB_NAME",
                                            value: "demo-sdm-job-3bd7f5e-container-maven-build-job-3bd7f5e-containe",
                                        },
                                        {
                                            name: "ATOMIST_REGISTRATION_NAME",
                                            value: "@atomist/demo-sdm-job-3bd7f5e-container-maven-build",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM",
                                            value: "T7GMF5USG",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_TEAM_NAME",
                                            value: "atomist-playground",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_ID",
                                            value: "258087f6-9130-556f-9572-c82981b6169e",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_SET_ID",
                                            value: "3bd7f5e0-f504-482c-8498-fd2e1c0492c2",
                                        },
                                        {
                                            name: "ATOMIST_GOAL_UNIQUE_NAME",
                                            value: "container-maven-build#container.ts:64",
                                        },
                                        {
                                            name: "ATOMIST_CORRELATION_ID",
                                            value: "6757edf5-a95b-4948-8dd2-dc9fd935509f",
                                        },
                                        {
                                            name: "ATOMIST_ISOLATED_GOAL",
                                            value: "true",
                                        },
                                    ],
                                    image: "atomist/demo-sdm:1.0.0-master.20191216211453",
                                    imagePullPolicy: "IfNotPresent",
                                    name: "demo-sdm-job-3bd7f5e-container-maven-build",
                                    ports: [
                                        {
                                            containerPort: 2866,
                                            name: "http",
                                            protocol: "TCP",
                                        },
                                    ],
                                    resources: {
                                        limits: {
                                            cpu: "1",
                                            memory: "2Gi",
                                        },
                                        requests: {
                                            cpu: "500m",
                                            memory: "1Gi",
                                        },
                                    },
                                    securityContext: {
                                        allowPrivilegeEscalation: false,
                                        privileged: false,
                                        readOnlyRootFilesystem: true,
                                        runAsGroup: 2866,
                                        runAsNonRoot: true,
                                        runAsUser: 2866,
                                    },
                                    terminationMessagePath: "/dev/termination-log",
                                    terminationMessagePolicy: "File",
                                    volumeMounts: [
                                        {
                                            mountPath: "/home/atomist",
                                            name: "atomist-home",
                                        },
                                        {
                                            mountPath: "/opt/atm",
                                            name: "demo-sdm",
                                            readOnly: true,
                                        },
                                        {
                                            mountPath: "/tmp",
                                            name: "sdm-tmp",
                                        },
                                        {
                                            mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
                                            name: "demo-sdm-token-vkrr4",
                                            readOnly: true,
                                        },
                                    ],
                                },
                            ],
                            dnsPolicy: "ClusterFirst",
                            enableServiceLinks: true,
                            initContainers: [
                                {
                                    args: [
                                        "git config --global user.email 'bot@atomist.com' \u0026\u0026 git config --global user.name 'Atomist Bot'",
                                    ],
                                    command: [
                                        "/bin/sh",
                                        "-c",
                                    ],
                                    env: [
                                        {
                                            name: "HOME",
                                            value: "/home/atomist",
                                        },
                                    ],
                                    image: "atomist/sdm-base:0.4.0-20191204153918",
                                    imagePullPolicy: "IfNotPresent",
                                    name: "atomist-home-git",
                                    resources: {},
                                    securityContext: {
                                        allowPrivilegeEscalation: false,
                                        privileged: false,
                                        readOnlyRootFilesystem: true,
                                        runAsGroup: 2866,
                                        runAsNonRoot: true,
                                        runAsUser: 2866,
                                    },
                                    terminationMessagePath: "/dev/termination-log",
                                    terminationMessagePolicy: "File",
                                    volumeMounts: [
                                        {
                                            mountPath: "/home/atomist",
                                            name: "atomist-home",
                                        },
                                        {
                                            mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
                                            name: "demo-sdm-token-vkrr4",
                                            readOnly: true,
                                        },
                                    ],
                                },
                            ],
                            priority: 0,
                            restartPolicy: "Never",
                            runtimeClassName: "gvisor",
                            schedulerName: "default-scheduler",
                            securityContext: {
                                fsGroup: 2866,
                            },
                            serviceAccount: "demo-sdm",
                            serviceAccountName: "demo-sdm",
                            terminationGracePeriodSeconds: 30,
                            tolerations: [
                                {
                                    effect: "NoSchedule",
                                    key: "sandbox.gke.io/runtime",
                                    operator: "Equal",
                                    value: "gvisor",
                                },
                                {
                                    effect: "NoExecute",
                                    key: "node.kubernetes.io/not-ready",
                                    operator: "Exists",
                                    tolerationSeconds: 300,
                                },
                                {
                                    effect: "NoExecute",
                                    key: "node.kubernetes.io/unreachable",
                                    operator: "Exists",
                                    tolerationSeconds: 300,
                                },
                            ],
                            volumes: [
                                {
                                    name: "demo-sdm",
                                    secret: {
                                        defaultMode: 288,
                                        secretName: "demo-sdm",
                                    },
                                },
                                {
                                    emptyDir: {},
                                    name: "atomist-home",
                                },
                                {
                                    emptyDir: {},
                                    name: "sdm-tmp",
                                },
                                {
                                    name: "demo-sdm-token-vkrr4",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "demo-sdm-token-vkrr4",
                                    },
                                },
                            ],
                        },
                    },
                },
            };
            assert.deepStrictEqual(j, e);
        });

    });

    describe("zombiePodFilter", () => {

        it("should return false when no statuses", () => {
            [
                {},
                { status: {} },
                { status: { containerStatuses: [] } },
            ].forEach((p: k8s.V1Pod) => {
                assert(!zombiePodFilter(p));
            });
        });

        it("should return false when only one status", () => {
            [
                {
                    running: {
                        startedAt: new Date(),
                    },
                },
                {
                    waiting: {},
                },
                {
                    terminated: {
                        containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f19743",
                        exitCode: 0,
                        finishedAt: new Date(),
                        reason: "Completed",
                        startedAt: new Date(),
                    },
                },
            ].forEach(s => {
                const p: k8s.V1Pod = {
                    status: {
                        containerStatuses: [{
                            containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.1.0",
                            imageID: "x/x@sha256:5aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "x",
                            ready: false,
                            restartCount: 0,
                            state: s,
                        }],
                    },
                };
                assert(!zombiePodFilter(p));
            });
        });

        it("should return false when first container running", () => {
            const p: k8s.V1Pod = {
                status: {
                    containerStatuses: [
                        {
                            containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.1.0",
                            imageID: "x/x@sha256:5aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "x",
                            ready: false,
                            restartCount: 0,
                            state: {
                                running: {
                                    startedAt: new Date(),
                                },
                            },
                        },
                        {
                            containerID: "containerd://adf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.2.0",
                            imageID: "x/x@sha256:6aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "y",
                            ready: false,
                            restartCount: 0,
                            state: {
                                running: {
                                    startedAt: new Date(),
                                },
                            },
                        },
                    ],
                },
            };
            assert(!zombiePodFilter(p));
        });

        it("should return false when all containers terminated", () => {
            const p: k8s.V1Pod = {
                status: {
                    containerStatuses: [
                        {
                            containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.1.0",
                            imageID: "x/x@sha256:5aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "x",
                            ready: false,
                            restartCount: 0,
                            state: {
                                terminated: {
                                    containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                                    exitCode: 0,
                                    finishedAt: new Date(),
                                    reason: "Completed",
                                    startedAt: new Date(),
                                },
                            },
                        },
                        {
                            containerID: "containerd://adf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.2.0",
                            imageID: "x/x@sha256:6aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "y",
                            ready: false,
                            restartCount: 0,
                            state: {
                                terminated: {
                                    containerID: "containerd://adf8c92f498ee8eb82135e4f25e8e2f1",
                                    exitCode: 0,
                                    finishedAt: new Date(),
                                    reason: "Completed",
                                    startedAt: new Date(),
                                },
                            },
                        },
                        {
                            containerID: "containerd://cdf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.3.0",
                            imageID: "x/x@sha256:7aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "y",
                            ready: false,
                            restartCount: 0,
                            state: {
                                terminated: {
                                    containerID: "containerd://cdf8c92f498ee8eb82135e4f25e8e2f1",
                                    exitCode: 0,
                                    finishedAt: new Date(),
                                    reason: "Completed",
                                    startedAt: new Date(),
                                },
                            },
                        },
                    ],
                },
            };
            assert(!zombiePodFilter(p));
        });

        it("should return true when first container terminated, others running", () => {
            const p: k8s.V1Pod = {
                status: {
                    containerStatuses: [
                        {
                            containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.1.0",
                            imageID: "x/x@sha256:5aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "x",
                            ready: false,
                            restartCount: 0,
                            state: {
                                terminated: {
                                    containerID: "containerd://bdf8c92f498ee8eb82135e4f25e8e2f1",
                                    exitCode: 0,
                                    finishedAt: new Date(),
                                    reason: "Completed",
                                    startedAt: new Date(),
                                },
                            },
                        },
                        {
                            containerID: "containerd://adf8c92f498ee8eb82135e4f25e8e2f1",
                            image: "x/x:0.2.0",
                            imageID: "x/x@sha256:6aa4b2f40d4f756826056b32bd3e2100",
                            lastState: {},
                            name: "y",
                            ready: false,
                            restartCount: 0,
                            state: {
                                running: {
                                    startedAt: new Date(),
                                },
                            },
                        },
                    ],
                },
            };
            assert(zombiePodFilter(p));
        });

    });

    describe("killJobFilter", () => {

        it("should return false for job that have not started", () => {
            const ps: k8s.V1Pod[] = [];
            [
                {},
                { status: {} },
            ].forEach((j: k8s.V1Job) => {
                assert(!killJobFilter(ps, 1000)(j));
            });
        });

        it("should return false for job younger than TTL", () => {
            const ps: k8s.V1Pod[] = [];
            const j: k8s.V1Job = {
                status: {
                    startTime: new Date(),
                },
            };
            assert(!killJobFilter(ps, 100000)(j));
        });

        it("should return true for job older than TTL", () => {
            const ps: k8s.V1Pod[] = [];
            const j: k8s.V1Job = {
                status: {
                    startTime: new Date(1),
                },
            };
            assert(killJobFilter(ps, 10)(j));
        });

        it("should return false for job not in pod list", () => {
            const ps: k8s.V1Pod[] = [
                { metadata: { ownerReferences: [{ kind: "Job", name: "j" }] } } as any,
                { metadata: { ownerReferences: [{ kind: "Job", name: "a" }] } } as any,
                { metadata: { ownerReferences: [{ kind: "Job", name: "y" }] } } as any,
                { metadata: {} },
                { metadata: { ownerReferences: [{ kind: "Job", name: "z" }] } } as any,
                {},
            ];
            const j: k8s.V1Job = {
                metadata: {
                    name: "b",
                    namespace: "dc",
                },
                status: {
                    startTime: new Date(),
                },
            };
            assert(!killJobFilter(ps, 100000)(j));
        });

        it("should return true for job in pod list", () => {
            const ps: k8s.V1Pod[] = [
                { metadata: { ownerReferences: [{ kind: "Job", name: "j" }] } } as any,
                { metadata: { ownerReferences: [{ kind: "Job", name: "a" }] } } as any,
                { metadata: { ownerReferences: [{ kind: "Job", name: "y" }] } } as any,
                { metadata: {} },
                { metadata: { ownerReferences: [{ kind: "Job", name: "z" }] } } as any,
                { metadata: { ownerReferences: [{ kind: "Job", name: "b" }] } } as any,
            ];
            const j: k8s.V1Job = {
                metadata: {
                    name: "b",
                    namespace: "dc",
                },
                status: {
                    startTime: new Date(),
                },
            };
            assert(killJobFilter(ps, 100000)(j));
        });

    });

});
