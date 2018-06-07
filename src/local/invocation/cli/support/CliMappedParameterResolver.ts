import { MappedParameters } from "@atomist/automation-client";
import { MappedParameterDeclaration } from "@atomist/automation-client/metadata/automationMetadata";
import { parseOwnerAndRepo } from "../../../binding/expandedTreeUtils";
import { MappedParameterResolver } from "../../../binding/MappedParameterResolver";

import * as os from "os";

export class CliMappedParameterResolver implements MappedParameterResolver {

    public resolve(md: MappedParameterDeclaration): string | undefined {
        switch (md.uri) {
            case MappedParameters.GitHubRepository :
                const { repo } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory);
                return repo;
            case MappedParameters.GitHubOwner :
                const { owner } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory);
                return owner;
            case MappedParameters.SlackTeam :
                return process.env.SLACK_TEAM || "local";
            case MappedParameters.SlackUserName :
                return process.env.SLACK_USER_NAME || os.userInfo().username;
            case MappedParameters.GitHubWebHookUrl :
                return "http://not.a.real.url";
        }
        if (!md.required) {
            return undefined;
        }
    }

    constructor(private readonly repositoryOwnerParentDirectory: string) {}
}
