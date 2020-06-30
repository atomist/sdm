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

import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
    loadKubernetesSpec,
    parseKubernetesSpec,
} from "../../../../lib/pack/k8s/deploy/spec";

describe("pack/k8s/deploy/spec", () => {

    describe("loadKubernetesSpec", () => {

        it("should not find a spec successfully", async () => {
            const p = InMemoryProject.of();
            const s = await loadKubernetesSpec(p, "drake");
            assert(s === undefined);
        });

        it("should not find the wrong spec", async () => {
            const p = InMemoryProject.of({ path: ".atomist/kubernetes/nick.json", content: "{}\n" });
            const s = await loadKubernetesSpec(p, "drake");
            assert(s === undefined);
        });

        it("should find the spec", async () => {
            const p = InMemoryProject.of({ path: ".atomist/kubernetes/nick.json", content: "{}\n" });
            const s = await loadKubernetesSpec(p, "nick");
            assert.deepStrictEqual(s, {});
        });

        it("should find the right spec", async () => {
            const p = InMemoryProject.of(
                { path: ".atomist/kubernetes/nick.json", content: "{}\n" },
                { path: ".atomist/kubernetes/drake.json", content: `{"which":"will"}\n` },
            );
            const s = await loadKubernetesSpec(p, "drake");
            assert.deepStrictEqual(s, { which: "will" });
        });

        it("should skip empty YAML", async () => {
            const p = InMemoryProject.of(
                { path: ".atomist/kubernetes/nick.yaml", content: "" },
                { path: ".atomist/kubernetes/nick.yml", content: "Bryter: Layter\n" },
            );
            const s = await loadKubernetesSpec(p, "nick");
            assert.deepStrictEqual(s, { Bryter: "Layter" });
        });

        it("should use YAML if JSON is bad", async () => {
            const c = `spec:
  template:
    spec:
      serviceAccountName: sdm-serviceaccount
      terminationGracePeriodSeconds: 180
`;
            const p = InMemoryProject.of(
                { path: ".atomist/kubernetes/nick.json", content: "}{" },
                { path: ".atomist/kubernetes/nick.yaml", content: c },
            );
            const s = await loadKubernetesSpec(p, "nick");
            const e = {
                spec: {
                    template: {
                        spec: {
                            serviceAccountName: "sdm-serviceaccount",
                            terminationGracePeriodSeconds: 180,
                        },
                    },
                },
            };
            assert.deepStrictEqual(s, e);
        });

    });

    describe("parseKubernetesSpec", () => {

        it("should not find a spec successfully", async () => {
            const p = InMemoryProject.of();
            const s = await parseKubernetesSpec(p, "drake.json");
            assert(s === undefined);
        });

        it("should not find the wrong spec", async () => {
            const p = InMemoryProject.of({ path: "nick.json", content: "{}\n" });
            const s = await parseKubernetesSpec(p, "drake.json");
            assert(s === undefined);
        });

        it("should find the spec", async () => {
            const p = InMemoryProject.of({ path: "nick.json", content: "{}\n" });
            const s = await parseKubernetesSpec(p, "nick.json");
            assert.deepStrictEqual(s, {});
        });

        it("should find the nested spec", async () => {
            const p = InMemoryProject.of({ path: "bryter/layter/nick.json", content: "{}\n" });
            const s = await parseKubernetesSpec(p, "bryter/layter/nick.json");
            assert.deepStrictEqual(s, {});
        });

        it("should find the right spec", async () => {
            const p = InMemoryProject.of(
                { path: "nick.json", content: "{}\n" },
                { path: "drake.json", content: `{"which":"will"}\n` },
            );
            const s = await parseKubernetesSpec(p, "drake.json");
            assert.deepStrictEqual(s, { which: "will" });
        });

        it("should parse empty YAML", async () => {
            const p = InMemoryProject.of({ path: "nick.yml", content: "" });
            const s = await parseKubernetesSpec(p, "nick.yml");
            assert(s === undefined);
        });

        it("should parse YAML", async () => {
            const c = `spec:
  template:
    spec:
      serviceAccountName: sdm-serviceaccount
      terminationGracePeriodSeconds: 180
`;
            const p = InMemoryProject.of({ path: "nick.yaml", content: c });
            const s = await parseKubernetesSpec(p, "nick.yaml");
            const e = {
                spec: {
                    template: {
                        spec: {
                            serviceAccountName: "sdm-serviceaccount",
                            terminationGracePeriodSeconds: 180,
                        },
                    },
                },
            };
            assert.deepStrictEqual(s, e);
        });

    });

});
