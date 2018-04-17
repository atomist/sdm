import { PackageLockFingerprinter } from "../../../../../../src/common/delivery/code/fingerprint/node/PackageLockFingerprinter";
import { CodeReactionInvocation } from "../../../../../../src";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";

describe("package-lock.json", () => {

    const fingerprinter = new PackageLockFingerprinter();

    it("should produce no fingerprint when no package-lock.json", async () => {
        const project = InMemoryProject.of();
        const cri = {project} as any as CodeReactionInvocation;
        const fp = await fingerprinter.action(cri);
        assert((fp as any[]).length === 0);
    });

    it("should produce fingerprint when package-lock.json found", async () => {
        const project = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1()));
        const cri = {project} as any as CodeReactionInvocation;
        const fp = await fingerprinter.action(cri) as Fingerprint;
        assert.equal(fp.abbreviation, "deps");
        assert(!!fp.sha);
    });

    it("should not detect change unless dependencies change", async () => {
        const project1 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({ lockfileVersion: 1})));
        const cri1 = {project: project1} as any as CodeReactionInvocation;
        const fp1 = await fingerprinter.action(cri1) as Fingerprint;

        const project2 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({lockfileVersion: 2})));
        const cri2 = {project: project2} as any as CodeReactionInvocation;
        const fp2 = await fingerprinter.action(cri2) as Fingerprint;
        assert.equal(fp1.sha, fp2.sha);
    });

    it("should detect change when dependencies change", async () => {
        const project1 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({antlrVersion: "0.2.0"})));
        const cri1 = {project: project1} as any as CodeReactionInvocation;
        const fp1 = await fingerprinter.action(cri1) as Fingerprint;

        const project2 = InMemoryProject.of(new InMemoryFile("package-lock.json", valid1({antlrVersion: "0.2.1"})));
        const cri2 = {project: project2} as any as CodeReactionInvocation;
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
