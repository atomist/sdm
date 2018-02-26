
import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";

export function coordinates(va: VersionedArtifact): string {
    let coords = `${va.groupId}:${va.artifactId}`;
    if (va.version) {
        coords += `:${va.version}`;
    }
    return coords;
}

/**
 * Convert Maven POM XML parser format to our VersionedArtifact
 * @param raw
 * @return {VersionedArtifact}
 */
export function toVersionedArtifact(raw: any): VersionedArtifact {
    const va = {
        groupId: raw.groupId[0],
        artifactId: raw.artifactId[0],
        version: raw.version[0],
        description: !!raw.description ? raw.description[0] : undefined,
    };
    return va;
}
