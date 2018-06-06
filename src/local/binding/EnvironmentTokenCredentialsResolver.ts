import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { CredentialsResolver } from "../../index";

export const EnvironmentTokenCredentialsResolver: CredentialsResolver = {

    eventHandlerCredentials() {
        return credentialsFromEnvironment();
    },

    commandHandlerCredentials() {
        return credentialsFromEnvironment();
    },

};

function failBecause(msg: string): string {
    throw new Error(msg);
}

function credentialsFromEnvironment(): ProjectOperationCredentials {
    const token = process.env.GITHUB_TOKEN || failBecause("GITHUB_TOKEN must be set");
    return {token};
}
