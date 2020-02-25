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
import * as k8s from "@kubernetes/client-node";
import * as _ from "lodash";
import * as assert from "power-assert";
import { applySpec } from "../../../../../lib/core/pack/k8s/kubernetes/apply";
import {
    KubernetesClients,
    makeApiClients,
} from "../../../../../lib/core/pack/k8s/kubernetes/clients";
import { loadKubeConfig } from "../../../../../lib/core/pack/k8s/kubernetes/config";
import {
    deleteAppResources,
    DeleteAppResourcesArgCluster,
    DeleteAppResourcesArgNamespaced,
    deleteSpec,
} from "../../../../../lib/core/pack/k8s/kubernetes/delete";
import {
    afterRetry,
    beforeRetry,
    k8sAvailable,
    rng,
} from "../k8s";

describe("pack/k8s/kubernetes/delete", function(): void {

    // tslint:disable-next-line:no-invalid-this
    this.timeout(5000);

    before(async function(): Promise<void> {
        if (!await k8sAvailable()) {
            // tslint:disable-next-line:no-invalid-this
            this.skip();
        }
        beforeRetry();
    });
    after(() => {
        afterRetry();
    });

    describe("deleteAppResources", () => {

        let clients: KubernetesClients;
        before(function(): void {
            let config: k8s.KubeConfig;
            try {
                config = loadKubeConfig();
            } catch (e) {
                // tslint:disable-next-line:no-invalid-this
                this.skip();
            }
            clients = makeApiClients(config);
        });

        it("should delete app resources and leave the rest", async () => {
            const a = {
                name: `delete-test-app-${rng()}`,
                ns: "default",
                workspaceId: "AN1M3",
            };
            const la = {
                "app.kubernetes.io/name": a.name,
                "atomist.com/workspaceId": a.workspaceId,
            };
            const ln = {
                "app.kubernetes.io/name": `delete-test-not-${rng()}`,
                "atomist.com/workspaceId": "AN1M4TR1X",
            };
            const st = {
                apiVersion: "v1",
                kind: "Service",
                metadata: { namespace: a.ns },
                spec: {
                    ports: [{ port: 80 }],
                    selector: { app: "delete-test-app" },
                },
            };
            const rt = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRole",
                metadata: {},
                rules: [{ apiGroups: [""], resources: ["pods"], verbs: ["get"] }],
            };
            const na = `delete-test-gone-${rng()}`;
            const nn = `delete-test-left-${rng()}`;
            const sa = _.merge({}, st, { metadata: { name: na, labels: la } });
            const ra = _.merge({}, rt, { metadata: { name: na, labels: la } });
            const sn = _.merge({}, st, { metadata: { name: nn, labels: ln } });
            const rn = _.merge({}, rt, { metadata: { name: nn, labels: ln } });
            for (const s of [sa, ra, sn, rn]) {
                await applySpec(s);
            }
            const ss0 = await execPromise("kubectl", ["get", "-n", a.ns, "services"]);
            assert(ss0.stdout.includes(na));
            assert(ss0.stdout.includes(nn));
            const sr0 = await execPromise("kubectl", ["get", "clusterroles"]);
            assert(sr0.stdout.includes(na));
            assert(sr0.stdout.includes(nn));
            const req = { ...a, clients };
            const sd: Omit<DeleteAppResourcesArgNamespaced, "req"> = {
                kind: "Service",
                namespaced: true,
                api: req.clients.core,
                lister: req.clients.core.listNamespacedService,
                deleter: req.clients.core.deleteNamespacedService,
            };
            const rd: Omit<DeleteAppResourcesArgCluster, "req"> = {
                kind: "ClusterRole",
                namespaced: false,
                api: req.clients.rbac,
                lister: req.clients.rbac.listClusterRole,
                deleter: req.clients.rbac.deleteClusterRole,
            };
            const ds = await deleteAppResources({ ...sd, req });
            const dr = await deleteAppResources({ ...rd, req });
            const ss1 = await execPromise("kubectl", ["get", "-n", a.ns, "services"]);
            assert(!ss1.stdout.includes(na));
            assert(ss1.stdout.includes(nn));
            const sr1 = await execPromise("kubectl", ["get", "clusterroles"]);
            assert(!sr1.stdout.includes(na));
            assert(sr1.stdout.includes(nn));
            for (const s of [sn, rn]) {
                await deleteSpec(s);
            }
            assert(ds.length === 1);
            assert(ds[0].kind === "Service");
            assert(ds[0].metadata.name === na);
            assert(ds[0].metadata.namespace === a.ns);
            assert(dr.length === 1);
            assert(dr[0].kind === "ClusterRole");
            assert(dr[0].metadata.name === na);
        }).timeout(10000);

    });

});
