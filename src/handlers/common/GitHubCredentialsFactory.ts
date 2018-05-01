import { Secret, Secrets } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { CredentialsFactory } from "./CredentialsFactory";

export class GitHubCredentialsFactory implements CredentialsFactory {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    public eventHandlerCredentials(): ProjectOperationCredentials {
        if (!this.githubToken) {
            throw new Error("githubToken has not been injected");
        }
        return {token: this.githubToken};
    }

}
