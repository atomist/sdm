import { isTokenCredentials, ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Convert the given credentials or token string to a token string
 * @param {ProjectOperationCredentials | string} credentials
 * @return {string}
 */
export function toToken(credentials: ProjectOperationCredentials | string): string {
    if (typeof credentials === "string") {
        return credentials;
    }
    if (isTokenCredentials(credentials)) {
        return credentials.token;
    }
    throw new Error("Cannot convert credentials to token");
}
