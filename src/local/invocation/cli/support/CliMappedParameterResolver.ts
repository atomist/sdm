import { MappedParameters } from "@atomist/automation-client";
import { MappedParameterDeclaration } from "@atomist/automation-client/metadata/automationMetadata";
import { parseOwnerAndRepo } from "../../../binding/expandedTreeUtils";
import { MappedParameterResolver } from "../../../binding/MappedParameterResolver";

export class CliMappedParameterResolver implements MappedParameterResolver {

    public resolve(md: MappedParameterDeclaration): string | undefined {
        switch (md.uri) {
            case MappedParameters.GitHubRepository :
                const { repo } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory);
                return repo;
            case MappedParameters.GitHubOwner :
                const { owner } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory);
                return owner;
        }
        if (!md.required) {
            return undefined;
        }
    }

    constructor(private readonly repositoryOwnerParentDirectory: string) {}
}
