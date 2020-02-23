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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as projectUtils from "@atomist/automation-client/lib/project/util/projectUtils";
import * as assert from "power-assert";
import { KubernetesSyncOptions } from "../../../../../lib/core/pack/k8s/config";
import {
    matchSpec,
    ProjectFileSpec,
    sameObject,
    syncResources,
} from "../../../../../lib/core/pack/k8s/sync/application";
import { k8sSpecGlob } from "../../../../../lib/core/pack/k8s/sync/diff";

describe("pack/k8s/sync/application", () => {

    describe("sameObject", () => {

        it("should return true for equivalent objects", () => {
            [
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                ],
                [
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                ],
            ].forEach(oo => {
                assert(sameObject(oo[0], oo[1]));
                assert(sameObject(oo[1], oo[0]));
            });
        });

        it("should return false for non-equivalent objects", () => {
            [
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "Service", metadata: { name: "bettylou", namespace: "harris" } },
                ],
                [
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                    { kind: "ClusterRole", metadata: { name: "bettylou" } },
                ],
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "Role", metadata: { name: "emmylou", namespace: "harris" } },
                ],
                [
                    { kind: "ClusterRoleBinding", metadata: { name: "emmylou" } },
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                ],
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                ],
            ].forEach(oo => {
                assert(!sameObject(oo[0], oo[1]));
                assert(!sameObject(oo[1], oo[0]));
            });
        });

        it("should return false for invalid objects", () => {
            [
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    undefined,
                ],
                [
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                    { kind: "ClusterRole" },
                ],
                [
                    { kind: "Service", metadata: { name: "emmylou", namespace: "harris" } },
                    { metadata: { name: "emmylou", namespace: "harris" } },
                ],
                [
                    { kind: "ClusterRole", metadata: { name: "emmylou" } },
                    { kind: "ClusterRole", metadata: {} },
                ],
            ].forEach(oo => {
                assert(!sameObject(oo[0], oo[1]));
                assert(!sameObject(oo[1], oo[0]));
            });
        });

    });

    describe("matchSpec", () => {

        it("should find nothing", () => {
            const sss = [
                [],
                [
                    {
                        file: new InMemoryProjectFile("svc.json", "{}"),
                        spec: {
                            apiVersion: "v1",
                            kind: "Service",
                            metadata: {
                                name: "lyle",
                                namespace: "lovett",
                            },
                        },
                    },
                    {
                        file: new InMemoryProjectFile("jondep.json", "{}"),
                        spec: {
                            apiVersion: "apps/v1",
                            kind: "Deployment",
                            metadata: {
                                name: "jon",
                                namespace: "lovett",
                            },
                        },
                    },
                    {
                        file: new InMemoryProjectFile("dep.json", "{}"),
                        spec: {
                            apiVersion: "apps/v1",
                            kind: "Deployment",
                            metadata: {
                                name: "lyle",
                                namespace: "alzado",
                            },
                        },
                    },
                ],
            ];
            sss.forEach(ss => {
                const s = {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "lyle",
                        namespace: "lovett",
                    },
                };
                const m = matchSpec(s, ss);
                assert(m === undefined);
            });
        });

        it("should find the file spec", () => {
            const s = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "lyle",
                    namespace: "lovett",
                },
            };
            const ss: ProjectFileSpec[] = [
                {
                    file: new InMemoryProjectFile("dep.json", "{}"),
                    spec: {
                        apiVersion: "apps/v1",
                        kind: "Deployment",
                        metadata: {
                            name: "lyle",
                            namespace: "lovett",
                        },
                    },
                },
            ];
            const m = matchSpec(s, ss);
            assert.deepStrictEqual(m, ss[0]);
        });

        it("should find the file spec with different apiVersion", () => {
            const s = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "lyle",
                    namespace: "lovett",
                },
            };
            const ss: ProjectFileSpec[] = [
                {
                    file: new InMemoryProjectFile("dep.json", "{}"),
                    spec: {
                        apiVersion: "extensions/v1beta1",
                        kind: "Deployment",
                        metadata: {
                            name: "lyle",
                            namespace: "lovett",
                        },
                    },
                },
            ];
            const m = matchSpec(s, ss);
            assert.deepStrictEqual(m, ss[0]);
        });

        it("should find the right file spec among several", () => {
            const s = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "lyle",
                    namespace: "lovett",
                },
            };
            const ss: ProjectFileSpec[] = [
                {
                    file: new InMemoryProjectFile("svc.json", "{}"),
                    spec: {
                        apiVersion: "v1",
                        kind: "Service",
                        metadata: {
                            name: "lyle",
                            namespace: "lovett",
                        },
                    },
                },
                {
                    file: new InMemoryProjectFile("jondep.json", "{}"),
                    spec: {
                        apiVersion: "apps/v1",
                        kind: "Deployment",
                        metadata: {
                            name: "jon",
                            namespace: "lovett",
                        },
                    },
                },
                {
                    file: new InMemoryProjectFile("dep.json", "{}"),
                    spec: {
                        apiVersion: "apps/v1",
                        kind: "Deployment",
                        metadata: {
                            name: "lyle",
                            namespace: "lovett",
                        },
                    },
                },
                {
                    file: new InMemoryProjectFile("dep.json", "{}"),
                    spec: {
                        apiVersion: "apps/v1",
                        kind: "Deployment",
                        metadata: {
                            name: "lyle",
                            namespace: "alzado",
                        },
                    },
                },
            ];
            const m = matchSpec(s, ss);
            assert.deepStrictEqual(m, ss[2]);
        });

    });

    describe("syncResources", () => {

        it("should create spec files", async () => {
            const p: GitProject = InMemoryProject.of() as any;
            p.isClean = async () => false;
            let commitMessage: string;
            p.commit = async msg => { commitMessage = msg; return p; };
            let pushed = false;
            p.push = async msg => { pushed = true; return p; };
            const a = {
                image: "hub.tonina.com/black-angel/como-yo:3.58",
                name: "tonina",
                ns: "black-angel",
                workspaceId: "T0N1N4",
            };
            const rs = [
                {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "Secret",
                    type: "Opaque",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                    data: {
                        Track01: "w4FyYm9sIERlIExhIFZpZGE=",
                        Track02: "Q2FseXBzbyBCbHVlcw==",
                    },
                },
            ];
            const o: KubernetesSyncOptions = {
                repo: {
                    owner: "tonina",
                    repo: "black-angel",
                    url: "https://github.com/tonina/black-angel",
                },
                specFormat: "json",
            };
            await syncResources(a, rs, "upsert", o)(p);
            const eCommitMessage = `Update black-angel/tonina:3.58

[atomist:generated] [atomist:sync-commit=@atomist/sdm-pack-k8s]
`;
            assert(commitMessage === eCommitMessage);
            assert(pushed, "commit was not pushed");
            assert(await p.totalFileCount() === 4);
            assert(p.fileExistsSync("70_black-angel_tonina_deployment.json"));
            assert(p.fileExistsSync("50_black-angel_tonina_service.json"));
            assert(p.fileExistsSync("20_black-angel_tonina_service-account.json"));
            assert(p.fileExistsSync("60_black-angel_tonina_secret.json"));
            const d = await (await p.getFile("70_black-angel_tonina_deployment.json")).getContent();
            const de = `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "tonina",
    "namespace": "black-angel"
  }
}
`;
            assert(d === de);
            const s = await (await p.getFile("60_black-angel_tonina_secret.json")).getContent();
            const se = `{
  "apiVersion": "v1",
  "data": {
    "Track01": "w4FyYm9sIERlIExhIFZpZGE=",
    "Track02": "Q2FseXBzbyBCbHVlcw=="
  },
  "kind": "Secret",
  "metadata": {
    "name": "tonina",
    "namespace": "black-angel"
  },
  "type": "Opaque"
}
`;
            assert(s === se);
        });

        it("should default to YAML", async () => {
            const p: GitProject = InMemoryProject.of() as any;
            p.isClean = async () => false;
            let commitMessage: string;
            p.commit = async msg => { commitMessage = msg; return p; };
            let pushed = false;
            p.push = async msg => { pushed = true; return p; };
            const a = {
                image: "hub.tonina.com/black-angel/como-yo:3.58",
                name: "tonina",
                ns: "black-angel",
                workspaceId: "T0N1N4",
            };
            const rs = [
                {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                    kind: "Service",
                    apiVersion: "v1",
                },
            ];
            const o: KubernetesSyncOptions = {
                repo: {
                    owner: "tonina",
                    repo: "black-angel",
                    url: "https://github.com/tonina/black-angel",
                },
            };
            await syncResources(a, rs, "upsert", o)(p);
            const eCommitMessage = `Update black-angel/tonina:3.58

[atomist:generated] [atomist:sync-commit=@atomist/sdm-pack-k8s]
`;
            assert(commitMessage === eCommitMessage);
            assert(pushed, "commit was not pushed");
            assert(await p.totalFileCount() === 2);
            assert(p.fileExistsSync("70_black-angel_tonina_deployment.yaml"));
            assert(p.fileExistsSync("50_black-angel_tonina_service.yaml"));
            const d = await (await p.getFile("70_black-angel_tonina_deployment.yaml")).getContent();
            const de = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: tonina
  namespace: black-angel
`;
            assert(d === de);
            const s = await (await p.getFile("50_black-angel_tonina_service.yaml")).getContent();
            const se = `apiVersion: v1
kind: Service
metadata:
  name: tonina
  namespace: black-angel
`;
            assert(s === se);
        });

        it("should update spec files and avoid conflicts", async () => {
            const depJson = JSON.stringify({
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "tonina",
                    namespace: "black-angel",
                },
            });
            const saYaml = `apiVersion: v1
kind: ServiceAccount
metadata:
  name: tonina
  namespace: black-angel
`;
            const p: GitProject = InMemoryProject.of(
                { path: "70_black-angel_tonina_deployment.json", content: depJson },
                { path: "50_black-angel_tonina_service.json", content: "{}\n" },
                { path: "19+black-angel+tonina+service-acct.yaml", content: saYaml },
            ) as any;
            p.isClean = async () => false;
            let commitMessage: string;
            p.commit = async msg => { commitMessage = msg; return p; };
            let pushed = false;
            p.push = async msg => { pushed = true; return p; };
            const a = {
                image: "hub.tonina.com/black-angel/como-yo:3.5.8-20180406",
                name: "tonina",
                ns: "black-angel",
                workspaceId: "T0N1N4",
            };
            const rs = [
                {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                        labels: {
                            "atomist.com/workspaceId": "T0N1N4",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "extensions/v1beta1",
                    kind: "Ingress",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                        labels: {
                            "atomist.com/workspaceId": "T0N1N4",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "Secret",
                    type: "Opaque",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                    data: {
                        Track01: "w4FyYm9sIERlIExhIFZpZGE=",
                        Track02: "Q2FseXBzbyBCbHVlcw==",
                    },
                },
            ];
            const o: KubernetesSyncOptions = {
                repo: {
                    owner: "tonina",
                    repo: "black-angel",
                    url: "https://github.com/tonina/black-angel",
                },
                secretKey: "10. Historia De Un Amor (feat. Javier Limón & Tali Rubinstein)",
                specFormat: "json",
            };
            await syncResources(a, rs, "upsert", o)(p);
            const eCommitMessage = `Update black-angel/tonina:3.5.8-20180406

[atomist:generated] [atomist:sync-commit=@atomist/sdm-pack-k8s]
`;
            assert(commitMessage === eCommitMessage);
            assert(pushed, "commit was not pushed");
            assert(await p.totalFileCount() === 6);
            assert(p.fileExistsSync("70_black-angel_tonina_deployment.json"));
            assert(p.fileExistsSync("50_black-angel_tonina_service.json"));
            assert(p.fileExistsSync("80_black-angel_tonina_ingress.json"));
            assert(p.fileExistsSync("19+black-angel+tonina+service-acct.yaml"));
            const dep = JSON.parse(await p.getFile("70_black-angel_tonina_deployment.json").then(f => f.getContent()));
            assert.deepStrictEqual(dep, rs[0]);
            const s = await p.getFile("50_black-angel_tonina_service.json").then(f => f.getContent());
            assert(s === "{}\n");
            const sa = await p.getFile("19+black-angel+tonina+service-acct.yaml").then(f => f.getContent());
            const sae = `apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    atomist.com/workspaceId: T0N1N4
  name: tonina
  namespace: black-angel
`;
            assert(sa === sae);
            let foundServiceSpec = false;
            await projectUtils.doWithFiles(p, k8sSpecGlob, async f => {
                if (/^50_black-angel_tonina_service_[a-f0-9]+\.json$/.test(f.path)) {
                    const c = await f.getContent();
                    const sv = JSON.parse(c);
                    assert.deepStrictEqual(sv, rs[1]);
                    foundServiceSpec = true;
                }
            });
            assert(foundServiceSpec, "failed to find new service spec");
            const sec = JSON.parse(await p.getFile("60_black-angel_tonina_secret.json").then(f => f.getContent()));
            const sece = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "tonina",
                    namespace: "black-angel",
                },
                data: {
                    Track01: "pIVq/+dRdfzQk4QRFkcwneZwzyAl3RBJTLI5WvAqdLg=",
                    Track02: "ArfFf8S0cHOycteqW6w/hGU7dIUuRBsbnUXSJ+yK7BI=",
                },
            };
            assert.deepStrictEqual(sec, sece);
        });

        it("should delete spec files", async () => {
            const depJson = JSON.stringify({
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "tonina",
                    namespace: "black-angel",
                },
            });
            const saYaml = `apiVersion: v1
kind: ServiceAccount
metadata:
  name: tonina
  namespace: black-angel
`;
            const svcJson = JSON.stringify({
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "tonina",
                    namespace: "black-angel",
                },
            });
            const p: GitProject = InMemoryProject.of(
                { path: "black-angel~tonina~deployment.json", content: depJson },
                { path: "black-angel-tonina-service.json", content: "{}\n" },
                { path: "black-angel-tonina-service-acct.yaml", content: saYaml },
                { path: "black-angel-tonina-svc.json", content: svcJson },
            ) as any;
            p.isClean = async () => false;
            let commitMessage: string;
            p.commit = async msg => { commitMessage = msg; return p; };
            let pushed = false;
            p.push = async msg => { pushed = true; return p; };
            const a = {
                name: "tonina",
                ns: "black-angel",
                workspaceId: "T0N1N4",
            };
            const rs = [
                {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                        labels: {
                            "atomist.com/workspaceId": "T0N1N4",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "extensions/v1beta1",
                    kind: "Ingress",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "tonina",
                        namespace: "black-angel",
                        labels: {
                            "atomist.com/workspaceId": "T0N1N4",
                        },
                    },
                },
            ];
            const o = {
                repo: {
                    owner: "tonina",
                    repo: "black-angel",
                    url: "https://github.com/tonina/black-angel",
                },
            };
            await syncResources(a, rs, "delete", o)(p);
            const eCommitMessage = `Delete black-angel/tonina

[atomist:generated] [atomist:sync-commit=@atomist/sdm-pack-k8s]
`;
            assert(commitMessage === eCommitMessage);
            assert(pushed, "commit was not pushed");
            assert(await p.totalFileCount() === 1);
            assert(!p.fileExistsSync("black-angel~tonina~deployment.json"));
            assert(p.fileExistsSync("black-angel-tonina-service.json"));
            assert(!p.fileExistsSync("black-angel-tonina-ingress.json"));
            assert(!p.fileExistsSync("black-angel-tonina-service-acct.yaml"));
            assert(!p.fileExistsSync("black-angel-tonina-svc.yaml"));
            const svc = await p.getFile("black-angel-tonina-service.json").then(f => f.getContent());
            assert(svc === "{}\n");
        });

    });

});
