import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { dependenciesFingerprintsFromParsedPom } from "./dependenciesFingerprintsFromParsedPom";
import { extractEffectivePom } from "./effectivePomExtractor";

export async function mavenFingerprinter(p: GitProject): Promise<Fingerprint[]> {
    try {
        await p.findFile("pom.xml");
        const epom = await extractEffectivePom(p);
        return Promise.all([dependenciesFingerprintsFromParsedPom].map(fp => fp(epom)));
    } catch {
        // If we can't find a pom, just exit
        return [];
    }
}
