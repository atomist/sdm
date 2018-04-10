export const SdmVersionRootType = "SdmVersion";

export interface SdmVersion {
    sha: string;
    repo: {
        name: string;
        owner: string;
        providerId: string;
    };
    version: string;
}
