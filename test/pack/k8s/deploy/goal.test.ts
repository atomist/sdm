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
    defaultDataSources,
    KubernetesDeployDataSources,
    KubernetesDeployRegistration,
} from "../../../../lib/pack/k8s/deploy/goal";

describe("pack/k8s/deploy/goal", () => {

    describe("kubernetesGoalDataSources", () => {

        it("should populate with all data sources", () => {
            const r: KubernetesDeployRegistration = {};
            const p = defaultDataSources(r);
            const e = {
                dataSources: [
                    KubernetesDeployDataSources.DeploymentSpec,
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.GoalEvent,
                    KubernetesDeployDataSources.IngressSpec,
                    KubernetesDeployDataSources.RoleBindingSpec,
                    KubernetesDeployDataSources.RoleSpec,
                    KubernetesDeployDataSources.SdmConfiguration,
                    KubernetesDeployDataSources.ServiceAccountSpec,
                    KubernetesDeployDataSources.ServiceSpec,
                ],
            };
            assert.deepStrictEqual(p, e);
            assert.deepStrictEqual(r, e);
        });

        it("should populate and leave other data untouched", () => {
            const r: KubernetesDeployRegistration = {
                name: "gram",
                pushTest: {
                    name: "True",
                } as any,
            };
            const p = defaultDataSources(r);
            const e = {
                name: "gram",
                pushTest: {
                    name: "True",
                },
                dataSources: [
                    KubernetesDeployDataSources.DeploymentSpec,
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.GoalEvent,
                    KubernetesDeployDataSources.IngressSpec,
                    KubernetesDeployDataSources.RoleBindingSpec,
                    KubernetesDeployDataSources.RoleSpec,
                    KubernetesDeployDataSources.SdmConfiguration,
                    KubernetesDeployDataSources.ServiceAccountSpec,
                    KubernetesDeployDataSources.ServiceSpec,
                ],
            };
            assert.deepStrictEqual(p, e);
            assert.deepStrictEqual(r, e);
        });

        it("should leave it an empty array", () => {
            const r: KubernetesDeployRegistration = { dataSources: [] };
            const p = defaultDataSources(r);
            const e: KubernetesDeployRegistration = { dataSources: [] };
            assert.deepStrictEqual(p, e);
            assert.deepStrictEqual(r, e);
        });

        it("should leave original data sources", () => {
            const r: KubernetesDeployRegistration = {
                dataSources: [
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.SdmConfiguration,
                    KubernetesDeployDataSources.GoalEvent,
                ],
            };
            const p = defaultDataSources(r);
            const e = {
                dataSources: [
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.SdmConfiguration,
                    KubernetesDeployDataSources.GoalEvent,
                ],
            };
            assert.deepStrictEqual(p, e);
            assert.deepStrictEqual(r, e);
        });

        it("should leave everything alone", () => {
            const r: KubernetesDeployRegistration = {
                name: "gram",
                dataSources: [
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.SdmConfiguration,
                ],
                pushTest: {
                    name: "True",
                } as any,
            };
            const p = defaultDataSources(r);
            const e = {
                name: "gram",
                dataSources: [
                    KubernetesDeployDataSources.Dockerfile,
                    KubernetesDeployDataSources.SdmConfiguration,
                ],
                pushTest: {
                    name: "True",
                },
            };
            assert.deepStrictEqual(p, e);
            assert.deepStrictEqual(r, e);
        });

    });

});
