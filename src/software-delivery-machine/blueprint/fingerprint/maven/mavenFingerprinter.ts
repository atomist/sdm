import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { extractEffectivePom } from "./effectivePomExtractor";
import { mavenDependenciesFingerprinter } from "./mavenDependenciesFingerprinter";

export async function mavenFingerprinter(p: GitProject): Promise<Fingerprint[]> {
    const epom = await extractEffectivePom(p);
    return Promise.all([ mavenDependenciesFingerprinter].map(fp => fp(epom)));
}
