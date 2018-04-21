import { logger } from "@atomist/automation-client";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import * as _ from "lodash";
import { CodeReactionInvocation } from "../../../..";
import { CodeAction } from "../CodeActionRegistration";
import { FingerprinterResult } from "./FingerprinterRegistration";

export async function computeFingerprints(cri: CodeReactionInvocation,
                                          fingerprinters: Array<CodeAction<FingerprinterResult>>): Promise<Fingerprint[]> {
    const results: Fingerprint[][] = await Promise.all(
        fingerprinters.map(async fp => {
            logger.info("Using fingerprinter %s to fingerprint %j", fp.name, cri.id);
            const f = await fp(cri);
            return isFingerprint(f) ? [f] : f;
        }),
    );
    return _.flatten(results);
}

export function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
