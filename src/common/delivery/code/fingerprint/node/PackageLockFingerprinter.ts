import { FingerprinterRegistration, FingerprinterResult } from "../FingerprinterRegistration";
import { CodeReactionInvocation } from "../../../../listener/CodeReactionListener";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { IsNode, PushTest } from "../../../../..";
import { computeShaOf } from "../../../../../util/misc/sha";
import { logger } from "@atomist/automation-client";

/**
 * Compute a fingerprint from a package-lock.json file.
 * Unlike a Maven POM, we can rely on ordering in a package lock file
 * so do not need to sort the data ourselves before sha-ing.
 */
export class PackageLockFingerprinter implements FingerprinterRegistration {

    public readonly name = "PackageLockFingerprinter";

    public readonly pushTest: PushTest = IsNode;

    public async action(cri: CodeReactionInvocation): Promise<FingerprinterResult> {
        const lockFile = await cri.project.getFile("package-lock.json");
        if (!lockFile) {
            return [];
        }
        try {
            const content = await lockFile.getContent();
            const json = JSON.parse(content);
            return {
                name: "dependencies",
                abbreviation: "deps",
                version: "0.1",
                sha: computeShaOf(json.dependencies),
                data: json,
            };
        } catch (err) {
            logger.warn("Unable to compute package-lock.json fingerprint: %s", err.message);
            return [];
        }
    }
}
