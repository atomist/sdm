import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { extractEffectivePom } from "./effectivePomExtractor";
import { dependenciesFingerprintsFromParsedPom } from "./dependenciesFingerprintsFromParsedPom";

export async function mavenFingerprinter(p: GitProject): Promise<Fingerprint[]> {
    const epom = await extractEffectivePom(p);
    return Promise.all([ dependenciesFingerprintsFromParsedPom].map(fp => fp(epom)));
}
