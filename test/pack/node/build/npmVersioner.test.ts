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
import { NodeFsLocalProject } from "@atomist/automation-client/lib/project/local/NodeFsLocalProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as assert from "power-assert";
import { formatDate } from "../../../../lib/api-helper/misc/dateFormat";
import { NpmVersioner, NpmVersionIncrementer, readPackageVersion } from "../../../../lib/pack/node/build/npmVersioner";

describe("build/npmVersioner", () => {
    describe("readPackageVersion", () => {
        it("reads version from package.json", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: `{"version":"1.2.3"}` });
            const l: any = {
                write: () => {},
            };
            const v = await readPackageVersion(p, l);
            assert(v === "1.2.3");
        });

        it("returns default when no package.json", async () => {
            const p = InMemoryProject.of();
            const l: any = {
                write: () => {},
            };
            const v = await readPackageVersion(p, l);
            assert(v === "0.0.0");
        });
    });

    describe("NpmVersioner", () => {
        it("returns timestamped version", async () => {
            const g: any = {
                branch: "master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const p: any = InMemoryProject.of({ path: "package.json", content: `{"version":"1.2.3"}` });
            const l: any = {
                write: () => {},
            };
            const da = formatDate();
            const v = await NpmVersioner(g, p, l);
            const db = formatDate();
            if (da === db) {
                assert(v === `1.2.3-${da}`);
            } else {
                assert(v === `1.2.3-${da}` || v === `1.2.3-${db}`);
            }
        });

        it("returns branch aware timestamped version", async () => {
            const g: any = {
                branch: "not-master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const p: any = InMemoryProject.of({ path: "package.json", content: `{"version":"1.2.3"}` });
            const l: any = {
                write: () => {},
            };
            const da = formatDate();
            const v = await NpmVersioner(g, p, l);
            const db = formatDate();
            if (da === db) {
                assert(v === `1.2.3-not-master.${da}`);
            } else {
                assert(v === `1.2.3-not-master.${da}` || v === `1.2.3-not-master.${db}`);
            }
        });
    });

    describe("NpmVersionIncrementer", () => {
        const tmpDirPrefix = path.join(os.tmpdir(), "atm-npm-version-incrementer-test");
        const toDelete: string[] = [];
        after(async () => {
            await Promise.all(toDelete.map(d => fs.remove(d)));
        });

        it("increments the patch version", async () => {
            const t = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(t);
            toDelete.push(t);
            const pj = path.join(t, "package.json");
            await fs.writeJson(pj, { name: "@doc/watson", version: "1.2.3" });
            const i: any = {
                owner: "doc",
                repo: "watson",
                url: "https://github.com/doc/watson",
            };
            const p = await NodeFsLocalProject.fromExistingDirectory(i, t);
            const l: any = {
                write: () => {},
            };
            const a: any = {
                currentVersion: "1.2.3",
                id: i,
                increment: "patch",
                log: l,
                project: p,
            };
            const r = await NpmVersionIncrementer(a);
            const e = {
                code: 0,
                message: "Incremented patch version in doc/watson: 1.2.3 => 1.2.4",
            };
            assert.deepStrictEqual(r, e);
            const n = await fs.readJson(pj);
            assert(n.version === "1.2.4");
        });

        it("creates the package.json and increments the major version", async () => {
            const t = `${tmpDirPrefix}-${guid()}`;
            await fs.ensureDir(t);
            toDelete.push(t);
            const i: any = {
                owner: "doc",
                repo: "watson",
                url: "https://github.com/doc/watson",
            };
            const p = await NodeFsLocalProject.fromExistingDirectory(i, t);
            const l: any = {
                write: () => {},
            };
            const a: any = {
                currentVersion: "1.2.3",
                id: i,
                increment: "major",
                log: l,
                project: p,
            };
            const r = await NpmVersionIncrementer(a);
            const e = {
                code: 0,
                message: "Incremented major version in doc/watson: 1.2.3 => 2.0.0",
            };
            assert.deepStrictEqual(r, e);
            const pj = path.join(t, "package.json");
            const n = await fs.readJson(pj);
            assert(n.version === "2.0.0");
        });
    });
});
