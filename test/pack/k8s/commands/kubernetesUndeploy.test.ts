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
import { kubernetesUndeploy } from "../../../../lib/pack/k8s/commands/kubernetesUndeploy";

describe("pack/k8s/commands/kubernetesUndeploy", () => {

    describe("kubernetesUndeploy", () => {

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
            const c = kubernetesUndeploy(s);
            assert(c.name === "KubernetesUndeploy");
            assert(c.intent === "kube undeploy imogen/heap");
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
            const c = kubernetesUndeploy(s);
            assert(c.name === "KubernetesUndeploy");
            assert(c.intent === undefined);
        });

    });

});
