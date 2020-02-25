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

import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import * as assert from "power-assert";
import {
    deleteApplication,
    upsertApplication,
} from "../../../../../lib/core/pack/k8s/kubernetes/application";
import { KubernetesApplication } from "../../../../../lib/core/pack/k8s/kubernetes/request";
import {
    afterRetry,
    beforeRetry,
    k8sAvailable,
    rng,
} from "../k8s";

describe("pack/k8s/kubernetes/application", () => {

    describe("upsertApplication", () => {

        it("should use no-op client to do nothing", async () => {
            const a: KubernetesApplication = {
                workspaceId: "TH340111NG5T0N35",
                name: "street-fighting-man",
                ns: "beggars-banquest",
                image: "rolling-stones/street-fighting-man:1968",
                mode: "sync",
                port: 3944,
                path: "/6",
            };
            const f = "@atomist/k8s-sdm";
            const r = await upsertApplication(a, f);
            assert(r.length === 4);
            assert(r.some(s => s.kind === "Namespace"));
            assert(r.some(s => s.kind === "Deployment"));
            assert(r.some(s => s.kind === "Service"));
            assert(r.some(s => s.kind === "Ingress"));
        });

    });

    describe("upsertApplication & deleteApplication", function(this: Mocha.Suite): void {

        this.timeout(10000);

        before(async function(this: Mocha.Context): Promise<void> {
            if (!await k8sAvailable()) {
                this.skip();
            }
            beforeRetry();
        });
        after(() => {
            afterRetry();
        });

        it("should create and delete application resources", async () => {
            const a = {
                workspaceId: "T3STW04K5PC",
                name: `app-test-${rng()}`,
                ns: "default",
                image: "nginx:1.17.5",
                port: 80,
                path: "/nginx",
            };
            const r = await upsertApplication(a, "@atomist/sdm-pack-k8s_test");
            assert(r, "resources not created");
            assert(r.length === 4);
            const ks = ["services", "deployments", "ingresses"];
            for (const k of ks) {
                const s = await execPromise("kubectl", ["get", "-n", a.ns, k]);
                assert(s.stdout.includes(a.name));
            }
            const d = await deleteApplication(a);
            assert(d, "resources not deleted");
            assert(d.length === 3);
            for (const k of ks) {
                const s = await execPromise("kubectl", ["get", "-n", a.ns, k]);
                assert(!s.stdout.includes(a.name));
            }
        });

    });

});
