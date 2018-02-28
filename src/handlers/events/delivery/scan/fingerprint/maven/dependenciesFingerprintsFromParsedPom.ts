import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { computeShaOf } from "../../../../../../util/misc/sha";
import { coordinates, toVersionedArtifact } from "./artifact";

/**
 * Don't call except via mavenFingerprinter
 * @param epom xml2js parsed form
 * @return {Promise<Fingerprint>}
 */
export async function dependenciesFingerprintsFromParsedPom(epom: any): Promise<Fingerprint> {
    const dependencies: VersionedArtifact[] =
        epom.project.dependencies[0].dependency.map(toVersionedArtifact);
    const sorted = dependencies
        .sort((d1, d2) => coordinates(d1) > coordinates(d2) ? 1 : -1);
    const json = JSON.stringify(sorted);
    return {
        name: "dependencies",
        abbreviation: "deps",
        version: "0.1",
        sha: computeShaOf(json),
        data: json,
    };
}
