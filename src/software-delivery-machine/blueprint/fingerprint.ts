import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { FingerprintOnPush } from "../../handlers/events/repo/FingerprintOnPush";

export const MyFingerprinter = () => new FingerprintOnPush([mavenFingerprinter]);

export async function mavenFingerprinter(p: GitProject): Promise<Fingerprint> {
    console.log("******* I LOVE STICKING MY FINGERS IN THINGS");
    return {
        name: "toad",
        abbreviation: "toa",
        version: "0.1",
        sha: new Date().getMilliseconds() + "",
        data: "toads are cool",
    };
}
