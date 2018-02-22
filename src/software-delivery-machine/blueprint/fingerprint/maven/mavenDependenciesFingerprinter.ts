import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { computeShaOf } from "../../../../util/sha";

export async function mavenDependenciesFingerprinter(epom: any): Promise<Fingerprint> {
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

function toVersionedArtifact(raw: any): VersionedArtifact {
    const va = {
        group: raw.groupId[0],
        artifact: raw.artifactId[0],
        version: raw.version[0],
    };
    return va;
}

export interface IdentifiedArtifact {

    group: string;

    artifact: string;
}

export interface VersionedArtifact extends IdentifiedArtifact {

    version: string;
}

export function coordinates(va: VersionedArtifact): string {
    let coords = `${va.group}:${va.artifact}`;
    if (va.version) {
        coords += `:${va.version}`;
    }
    return coords;
}
