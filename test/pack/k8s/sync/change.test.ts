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

import * as acglobals from "@atomist/automation-client/lib/globals";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import * as assert from "power-assert";
import * as api from "../../../../lib/pack/k8s/kubernetes/api";
import {
    calculateChanges,
    changeResource,
    filterIgnoredSpecs,
    hasMetadataAnnotation,
} from "../../../../lib/pack/k8s/sync/change";
import { PushDiff } from "../../../../lib/pack/k8s/sync/diff";
import * as prv from "../../../../lib/pack/k8s/sync/previousSpecVersion";

describe("pack/k8s/sync/change", () => {

    let originalAutomationClient: any;
    before(() => {
        originalAutomationClient = Object.getOwnPropertyDescriptor(acglobals, "automationClientInstance");
        Object.defineProperty(acglobals, "automationClientInstance", {
            value: () => ({
                configuration: {
                    name: "@joe-henry/scar",
                },
            }),
        });
    });
    after(() => {
        Object.defineProperty(acglobals, "automationClientInstance", originalAutomationClient);
    });

    describe("calculateChanges", () => {

        it("should delete everything", () => {
            const b = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
            ];
            const c = calculateChanges(b, undefined, "delete");
            const e = [
                { change: "delete", spec: { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "delete", spec: { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "delete", spec: { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } } },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should apply everything", () => {
            const a = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
            ];
            [
                undefined,
                [],
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                ],
            ].forEach(b => {
                const c = calculateChanges(b, a, "apply");
                const e = [
                    { change: "apply", spec: { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } } },
                    { change: "apply", spec: { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } } },
                    { change: "apply", spec: { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } } },
                ];
                assert.deepStrictEqual(c, e);
            });
        });

        it("should apply after and delete befores not in after", () => {
            const a = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
            ];
            const b = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
            ];
            const c = calculateChanges(b, a, "apply");
            const e = [
                { change: "apply", spec: { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "delete", spec: { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } } },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should ignore changes with ignore annotation", () => {
            const a = [
                {
                    kind: "ConfigMap", metadata: {
                        name: "joe",
                        namespace: "henry",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
            ];
            const c = calculateChanges([], a, "apply");
            assert.deepStrictEqual(c, []);
        });

        it("should include changes with wrong ignore annotation", () => {
            const a = [
                {
                    kind: "ConfigMap", metadata: {
                        name: "joe",
                        namespace: "henry",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/trampoline": "ignore" },
                    },
                },
            ];
            const c = calculateChanges([], a, "apply");
            const e = [{
                change: "apply",
                spec: {
                    kind: "ConfigMap", metadata: {
                        name: "joe",
                        namespace: "henry",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/trampoline": "ignore" },
                    },
                },
            }];
            assert.deepStrictEqual(c, e);
        });

        it("should include changes when ignore annotation removed", () => {
            const a = [
                { kind: "ConfigMap", metadata: { name: "joe", namespace: "henry" } },
            ];
            const b = [
                {
                    kind: "ConfigMap", metadata: {
                        name: "joe",
                        namespace: "henry",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
            ];
            const c = calculateChanges(b, a, "apply");
            const e = [{
                change: "apply",
                spec: { kind: "ConfigMap", metadata: { name: "joe", namespace: "henry" } },
            }];
            assert.deepStrictEqual(c, e);
        });

        it("should return no change when ignore annotation added", () => {
            const a = [
                {
                    kind: "ConfigMap", metadata: {
                        name: "joe",
                        namespace: "henry",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
            ];
            [
                undefined,
                [],
                [{ kind: "ConfigMap", metadata: { name: "joe", namespace: "henry" } }],
            ].forEach(b => {
                const c = calculateChanges(b, a, "apply");
                assert.deepStrictEqual(c, []);
            });
        });

        it("should respect ignore annotation", () => {
            const a = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                {
                    kind: "ConfigMap", metadata: {
                        name: "louemmy", namespace: "sirrah",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
            ];
            const b = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                {
                    kind: "ConfigMap", metadata: {
                        name: "emmylou", namespace: "harris",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
                {
                    kind: "ConfigMap", metadata: {
                        name: "louemmy", namespace: "sirrah",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" },
                    },
                },
            ];
            const c = calculateChanges(b, a, "apply");
            const e = [
                { change: "apply", spec: { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "delete", spec: { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } } },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should ignore ignore annotation for different sdm name", () => {

            const a = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                {
                    kind: "ConfigMap", metadata: {
                        name: "louemmy", namespace: "sirrah",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore" },
                    },
                },
            ];
            const b = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                {
                    kind: "ConfigMap", metadata: {
                        name: "emmylou", namespace: "harris",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore" },
                    },
                },
                {
                    kind: "ConfigMap", metadata: {
                        name: "louemmy", namespace: "sirrah",
                        annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore" },
                    },
                },
            ];
            const c = calculateChanges(b, a, "apply");
            const e = [
                { change: "apply", spec: { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } } },
                { change: "apply", spec: { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } } },
                {
                    change: "apply", spec: {
                        kind: "ConfigMap", metadata: {
                            name: "louemmy", namespace: "sirrah",
                            annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore" },
                        },
                    },
                },
                { change: "delete", spec: { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris" } } },
                {
                    change: "delete", spec: {
                        kind: "ConfigMap", metadata: {
                            name: "emmylou", namespace: "harris",
                            annotations: { "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore" },
                        },
                    },
                },
            ];
            assert.deepStrictEqual(c, e);
        });

    });

    describe("changeResources", () => {

        const resource = {
            apiVersion: "v1",
            kind: "Secret",
            type: "Opaque",
            metadata: {
                name: "mysecret",
                namespace: "mynamespace",
            },
            data: {
                username: "dGhlIHJvb3RtaW5pc3RyYXRvcg==",
                password: "Y29ycmVjdCBob3JzZSBiYXR0ZXJ5IHN0YXBsZQ==",
            },
        };

        let origClientDelete: any;
        let origClientPatch: any;
        let origClientRead: any;
        let origPreviousSpecVersion: any;

        before(() => {
            origClientDelete = Object.getOwnPropertyDescriptor(api.K8sObjectApi.prototype, "delete");
            origClientPatch = Object.getOwnPropertyDescriptor(api.K8sObjectApi.prototype, "patch");
            origClientRead = Object.getOwnPropertyDescriptor(api.K8sObjectApi.prototype, "read");
            origPreviousSpecVersion = Object.getOwnPropertyDescriptor(prv, "previousSpecVersion");

            Object.defineProperty(api.K8sObjectApi.prototype, "read", {
                value: async (s: k8s.KubernetesObject) => s,
            });
        });

        after(() => {
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", origClientDelete);
            Object.defineProperty(api.K8sObjectApi.prototype, "patch", origClientPatch);
            Object.defineProperty(api.K8sObjectApi.prototype, "read", origClientRead);
            Object.defineProperty(prv, "previousSpecVersion", origPreviousSpecVersion);
        });

        it("should throw error if resource file does not exist", async () => {
            const project: GitProject = InMemoryProject.of() as any;
            const diff: PushDiff = {
                change: "apply",
                path: "fake.path",
                sha: "fake.sha",
            };

            try {
                await changeResource(project, diff);
                assert.fail("should not get here");
            } catch (e) {
                assert(e.message === "Resource spec file 'fake.path' does not exist in project");
            }
        });

        it("should delete resource", async () => {
            let deleteCalled = false;
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async (spec: k8s.KubernetesObject, body: any) => {
                    deleteCalled = true;
                    assert(spec.apiVersion === "v1");
                    assert(spec.kind === "Secret");
                    assert(spec.metadata.name === "mysecret");
                    assert(spec.metadata.namespace === "mynamespace");
                    return spec;
                },
            });
            Object.defineProperty(prv, "previousSpecVersion", {
                value: async () => yaml.safeDump(resource),
            });
            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async () => { throw new Error("patch shouldn't be called"); },
            });

            const project: GitProject = InMemoryProject.of() as any;
            const diff: PushDiff = {
                change: "delete",
                path: "secret.yaml",
                sha: "abcdef01234567890",
            };
            await changeResource(project, diff);
            assert(deleteCalled, "delete was never called");
        });

        it("should patch resource", async () => {
            let patchCalled = false;
            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async (spec: k8s.KubernetesObject) => {
                    patchCalled = true;
                    assert(spec.apiVersion === "v1");
                    assert(spec.kind === "Secret");
                    assert(spec.metadata.name === "mysecret");
                    assert(spec.metadata.namespace === "mynamespace");
                    return spec;
                },
            });
            Object.defineProperty(prv, "previousSpecVersion", {
                value: async () => yaml.safeDump(resource),
            });
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async () => { throw new Error("delete shouldn't be called"); },
            });

            const project: GitProject = InMemoryProject.of({
                path: "secret.yaml",
                content: yaml.safeDump(resource),
            }) as any;
            const diff: PushDiff = {
                change: "apply",
                path: "secret.yaml",
                sha: "abcdef0123456789",
            };
            await changeResource(project, diff);
            assert(patchCalled, "patch was never called");
        });

        it("should not patch spec with ignore annotation", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "mysecret",
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore",
                    },
                },
                data: {
                    username: "dGhlIHJvb3RtaW5pc3RyYXRvcg==",
                    password: "Y29ycmVjdCBob3JzZSBiYXR0ZXJ5IHN0YXBsZQ==",
                },
            };

            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async () => { throw new Error("patch shouldn't be called"); },
            });
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async () => { throw new Error("delete shouldn't be called"); },
            });
            Object.defineProperty(prv, "previousSpecVersion", {
                value: async () => JSON.stringify(r),
            });

            const project: GitProject = InMemoryProject.of({
                path: "secret.json",
                content: JSON.stringify(r),
            }) as any;
            const diff: PushDiff = {
                change: "apply",
                path: "secret.json",
                sha: "abcdef0123456789",
            };
            await changeResource(project, diff);
        });

        it("should patch resources with ignore annotation for different sdm name", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "mysecret",
                    namespace: "ignorenamespace",
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore",
                    },
                },
                data: {
                    username: "dGhlIHJvb3RtaW5pc3RyYXRvcg==",
                    password: "Y29ycmVjdCBob3JzZSBiYXR0ZXJ5IHN0YXBsZQ==",
                },
            };

            Object.defineProperty(prv, "previousSpecVersion", {
                value: async () => JSON.stringify(r),
            });
            let patchCalled = false;
            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async (spec: k8s.KubernetesObject) => {
                    patchCalled = true;
                    assert(spec.apiVersion === "v1");
                    assert(spec.kind === "Secret");
                    assert(spec.metadata.name === "mysecret");
                    assert(spec.metadata.namespace === "ignorenamespace");
                    return spec;
                },
            });
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async () => { throw new Error("delete shouldn't be called"); },
            });

            const project: GitProject = InMemoryProject.of({
                path: "secret.json",
                content: yaml.safeDump(r),
            }) as any;
            const diff: PushDiff = {
                change: "apply",
                path: "secret.json",
                sha: "0123456789abcdef",
            };
            await changeResource(project, diff);
            assert(patchCalled, "patch was never called");
        });

        it("should not delete spec with ignore annotation", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "mysecret",
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore",
                    },
                },
                data: {
                    username: "dGhlIHJvb3RtaW5pc3RyYXRvcg==",
                    password: "Y29ycmVjdCBob3JzZSBiYXR0ZXJ5IHN0YXBsZQ==",
                },
            };

            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async () => { throw new Error("patch shouldn't be called"); },
            });

            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async () => { throw new Error("delete shouldn't be called"); },
            });
            Object.defineProperty(prv, "previousSpecVersion", {
                value: async () => yaml.safeDump(r),
            });

            const project: GitProject = InMemoryProject.of() as any;
            const diff: PushDiff = {
                change: "delete",
                path: "secret.yaml",
                sha: "01234abc56789def",
            };
            await changeResource(project, diff);
        });

        it("should delete spec with ignore annotation for different sdm name", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "mysecret",
                    namespace: "ignorenamespace",
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore",
                    },
                },
                data: {
                    username: "dGhlIHJvb3RtaW5pc3RyYXRvcg==",
                    password: "Y29ycmVjdCBob3JzZSBiYXR0ZXJ5IHN0YXBsZQ==",
                },
            };

            Object.defineProperty(prv, "previousSpecVersion", {
                value: async (baseDir: string, specPath: string, sha: string) => yaml.safeDump(r),
            });
            Object.defineProperty(api.K8sObjectApi.prototype, "patch", {
                value: async (spec: k8s.KubernetesObject) => { throw new Error("patch shouldn't be called"); },
            });
            let deleteCalled = false;
            Object.defineProperty(api.K8sObjectApi.prototype, "delete", {
                value: async (spec: k8s.KubernetesObject, body: any) => {
                    deleteCalled = true;
                    assert(spec.apiVersion === "v1");
                    assert(spec.kind === "Secret");
                    assert(spec.metadata.name === "mysecret");
                    assert(spec.metadata.namespace === "ignorenamespace");
                    return spec;
                },
            });

            const project: GitProject = InMemoryProject.of() as any;
            const diff: PushDiff = {
                change: "delete",
                path: "secret.yaml",
                sha: "a01b23c45d67e89f",
            };
            await changeResource(project, diff);
            assert(deleteCalled, "delete was never called");
        });

    });

    describe("filterIgnoredSpecs", () => {

        it("should do nothing successfully", () => {
            [undefined, []].forEach(s => {
                const f = filterIgnoredSpecs(s);
                assert.deepStrictEqual(f, []);
            });
        });

        it("should filter out ignored specs", () => {
            const a = { "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore" };
            const s = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Deployment", metadata: { name: "emmylou", namespace: "harris", annotations: a } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Role", metadata: { name: "emmylou", namespace: "harris", annotations: a } },
                { kind: "ConfigMap", metadata: { name: "emmylou", namespace: "harris", annotations: { foo: "ignore" } } },
            ];
            const f = filterIgnoredSpecs(s);
            const e = [
                { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "Secret", metadata: { name: "emmylou", namespace: "harris" } },
                { kind: "ConfigMap", metadata: { name: "emmylou", namespace: "harris", annotations: { foo: "ignore" } } },
            ];
            assert.deepStrictEqual(f, e);
        });

    });

    describe("hasMetadataAnnotation", () => {

        it("all present", () => {
            const r = {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "ignore",
                    },
                },
                data: {
                    color: "obtuse vermilion",
                },
            };
            const result = hasMetadataAnnotation(r, "sync", "ignore");
            assert(result);
        });

        it("SDM not found, key and value found", () => {
            const r = {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/with-no-scar": "ignore",
                    },
                },
                data: {
                    color: "obtuse vermilion",
                },
            };
            const result = hasMetadataAnnotation(r, "sync", "ignore");
            assert(result === false);
        });

        it("key not found, SDM and value found", () => {
            const r = {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    annotations: {
                        "atomist.com/sdm-pack-k8s/invalid-key/@joe-henry/scar": "ignore",
                    },
                },
                data: {
                    color: "obtuse vermilion",
                },
            };
            const result = hasMetadataAnnotation(r, "sync", "ignore");
            assert(result === false);
        });

        it("value not found, SDM and key found", () => {
            const r = {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    annotations: {
                        "atomist.com/sdm-pack-k8s/sync/@joe-henry/scar": "Rolling stones",
                    },
                },
                data: {
                    color: "obtuse vermilion",
                },
            };
            const result = hasMetadataAnnotation(r, "sync", "ignore");
            assert(result === false);
        });

        it("none present", () => {
            const r = {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    annotations: {
                        "atomist.com/sdm-pack-k8s/invalid-key/@joe-henry/with-no-scar": "Rolling stones",
                    },
                },
                data: {
                    color: "obtuse vermilion",
                },
            };
            const result = hasMetadataAnnotation(r, "sync", "ignore");
            assert(result === false);
        });

    });

});
