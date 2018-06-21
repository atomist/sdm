/*
 * Copyright © 2018 Atomist, Inc.
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

import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { PushImpactListenerInvocation } from "../../../src/api/listener/PushImpactListener";
import { PackageLockFingerprinter } from "../../../src/pack/node/PackageLockFingerprinter";

describe("package-lock.json", () => {

    const fingerprinter = new PackageLockFingerprinter();

    it("should produce no fingerprint when no package-lock.json", async () => {
        const project = InMemoryProject.of();
        const cri = {project} as any as PushImpactListenerInvocation;
        const fp = await fingerprinter.action(cri);
        assert.equal((fp as any[]).length, 0);
    });

    it("should produce fingerprint when package-lock.json found", async () => {
        const project = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1()));
        const cri = {project} as any as PushImpactListenerInvocation;
        const fp = await fingerprinter.action(cri) as Fingerprint;
        assert.equal(fp.abbreviation, "deps");
        assert(!!fp.sha);
    });

    it("should not detect change unless dependencies change", async () => {
        const project1 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({ lockfileVersion: 1})));
        const cri1 = {project: project1} as any as PushImpactListenerInvocation;
        const fp1 = await fingerprinter.action(cri1) as Fingerprint;

        const project2 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({lockfileVersion: 2})));
        const cri2 = {project: project2} as any as PushImpactListenerInvocation;
        const fp2 = await fingerprinter.action(cri2) as Fingerprint;
        assert.equal(fp1.sha, fp2.sha);
    });

    it("should detect change when dependencies change", async () => {
        const project1 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({antlrVersion: "0.2.0"})));
        const cri1 = {project: project1} as any as PushImpactListenerInvocation;
        const fp1 = await fingerprinter.action(cri1) as Fingerprint;

        const project2 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({antlrVersion: "0.2.1"})));
        const cri2 = {project: project2} as any as PushImpactListenerInvocation;
        const fp2 = await fingerprinter.action(cri2) as Fingerprint;
        assert.notEqual(fp1.sha, fp2.sha);
    });

});

// tslint:disable

function valid1(params: Partial<{lockfileVersion: number, antlrVersion: string}> = {}) {
    const paramsToUse = {
        lockfileVersion: 1,
        antlrVersion: "0.2.0",
        ...params,
    };
    return JSON.stringify({
        "name": "@atomist/sdm",
        "version": "0.0.1",
        lockfileVersion: paramsToUse.lockfileVersion,
        "requires": true,
        "dependencies": {
            "@atomist/antlr": {
                "version": paramsToUse.antlrVersion,
                "resolved": "https://registry.npmjs.org/@atomist/antlr/-/antlr-0.2.0.tgz",
                "integrity": "sha512-UM76Knaans8ZYn/4aKWx/EVnLqsjsFqnDuaObC08A0o7sr+m7xeBt3LyWfB2jTfIjXFztKG02DA9sHtGspAI/Q==",
                "requires": {
                    "@atomist/automation-client": "0.6.6",
                    "antlr4ts": "0.4.1-alpha.0",
                    "lodash": "4.17.5"
                }
            }
        }
    }, null, 2);
}
