export interface IdentifiedArtifact {

    group: string;

    artifact: string;
}

/**
 * Represents a Maven GAV
 */
export interface VersionedArtifact extends IdentifiedArtifact {

    version: string;
}
