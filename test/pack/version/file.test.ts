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
    FileVersionIncrementer,
    HasVersionFile,
    readVersionFile,
    versionFilePath,
    writeVersionFile,
} from "../../../lib/pack/version/file";

describe("file", () => {
    describe("HasVersionFile", () => {
        it("detects .version", async () => {
            const p = InMemoryProject.of({ path: ".version", content: "1.2.3\n" });
            const i: any = { project: p };
            const r = await HasVersionFile.mapping(i);
            assert(r, "failed to find .version");
        });

        it("detects VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "1.2.3\n" });
            const i: any = { project: p };
            const r = await HasVersionFile.mapping(i);
            assert(r, "failed to find VERSION");
        });

        it("detects .version when both", async () => {
            const p = InMemoryProject.of(
                { path: ".version", content: "1.2.3\n" },
                { path: "VERSION", content: "3.2.1\n" },
            );
            const i: any = { project: p };
            const r = await HasVersionFile.mapping(i);
            assert(r, "failed to find either");
        });

        it("correctly finds nothing", async () => {
            const p = InMemoryProject.of();
            const i: any = { project: p };
            const r = await HasVersionFile.mapping(i);
            assert(!r, "found something when there was nothing");
        });
    });

    describe("versionPath", () => {
        it("finds .version", async () => {
            const p = InMemoryProject.of({ path: ".version", content: "1.2.3\n" });
            const v = await versionFilePath(p);
            assert(v === ".version");
        });

        it("finds VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "3.4.5" });
            const v = await versionFilePath(p);
            assert(v === "VERSION");
        });

        it("prefers .version over VERSION", async () => {
            const p = InMemoryProject.of(
                { path: ".version", content: "\n1.2.3\n\n" },
                { path: "VERSION", content: "3.4.5" },
            );
            const v = await versionFilePath(p);
            assert(v === ".version");
        });

        it("returns .version if no version file", async () => {
            const p = InMemoryProject.of();
            const v = await versionFilePath(p);
            assert(v === ".version");
        });
    });

    describe("readVersionFile", () => {
        it("reads version from .version", async () => {
            const p = InMemoryProject.of({ path: ".version", content: "1.2.3\n" });
            const l: any = { write: () => {} };
            const v = await readVersionFile(p, l);
            assert(v === "1.2.3");
        });

        it("reads version from VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "3.4.5" });
            const l: any = { write: () => {} };
            const v = await readVersionFile(p, l);
            assert(v === "3.4.5");
        });

        it("prefers .version over VERSION", async () => {
            const p = InMemoryProject.of(
                { path: ".version", content: "\n1.2.3\n\n" },
                { path: "VERSION", content: "3.4.5" },
            );
            const l: any = { write: () => {} };
            const v = await readVersionFile(p, l);
            assert(v === "1.2.3");
        });

        it("returns 0.0.0 if no version file", async () => {
            const p = InMemoryProject.of();
            const l: any = { write: () => {} };
            const v = await readVersionFile(p, l);
            assert(v === "0.0.0");
        });
    });

    describe("writeVersionFile", () => {
        it("writes version to .version", async () => {
            const p = InMemoryProject.of({ path: ".version", content: "1.2.3\n" });
            const l: any = { write: () => {} };
            await writeVersionFile(p, l, "1.2.4");
            const v = await (await p.getFile(".version")).getContent();
            assert(v === "1.2.4\n");
        });

        it("writes version to VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "3.4.5" });
            const l: any = { write: () => {} };
            await writeVersionFile(p, l, "4.0.0");
            const v = await (await p.getFile("VERSION")).getContent();
            assert(v === "4.0.0\n");
        });

        it("writes to .version over VERSION", async () => {
            const p = InMemoryProject.of(
                { path: ".version", content: "\n1.2.3\n\n" },
                { path: "VERSION", content: "3.4.5" },
            );
            const l: any = { write: () => {} };
            await writeVersionFile(p, l, "3.5.0");
            const v = await (await p.getFile(".version")).getContent();
            assert(v === "3.5.0\n");
        });

        it("creates .version if no version file", async () => {
            const p = InMemoryProject.of();
            const l: any = { write: () => {} };
            await writeVersionFile(p, l, "0.1.0");
            const v = await (await p.getFile(".version")).getContent();
            assert(v === "0.1.0\n");
        });
    });

    describe("FileVersionIncrementer", () => {
        it("increments patch version in .version", async () => {
            const p = InMemoryProject.of({ path: ".version", content: "1.2.3\n" });
            const l: any = { write: () => {} };
            const a: any = {
                currentVersion: "1.2.3",
                id: p.id,
                increment: "patch",
                log: l,
                project: p,
            };
            const r = await FileVersionIncrementer(a);
            assert(r.code === 0);
            const v = await (await p.getFile(".version")).getContent();
            assert(v === "1.2.4\n");
        });

        it("increments minor version in VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "3.2.1\n" });
            const l: any = { write: () => {} };
            const a: any = {
                currentVersion: "3.2.1",
                id: p.id,
                increment: "minor",
                log: l,
                project: p,
            };
            const r = await FileVersionIncrementer(a);
            assert(r.code === 0);
            const v = await (await p.getFile("VERSION")).getContent();
            assert(v === "3.3.0\n");
        });

        it("refuses to decrement version in VERSION", async () => {
            const p = InMemoryProject.of({ path: "VERSION", content: "3.3.0\n" });
            const l: any = { write: () => {} };
            const a: any = {
                currentVersion: "3.2.1",
                id: p.id,
                increment: "patch",
                log: l,
                project: p,
            };
            const r = await FileVersionIncrementer(a);
            assert(r.code === 1);
            assert(r.message);
            assert(/appears to have already been incremented/.test(r.message));
            const v = await (await p.getFile("VERSION")).getContent();
            assert(v === "3.3.0\n");
        });

        it("increments major version creates .version", async () => {
            const p = InMemoryProject.of();
            const l: any = { write: () => {} };
            const a: any = {
                currentVersion: "1.2.3",
                id: p.id,
                increment: "major",
                log: l,
                project: p,
            };
            const r = await FileVersionIncrementer(a);
            assert(r.code === 0);
            const v = await (await p.getFile(".version")).getContent();
            assert(v === "2.0.0\n");
        });
    });
});
