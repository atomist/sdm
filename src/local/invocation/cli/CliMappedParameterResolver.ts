import { MappedParameterDeclaration } from "@atomist/automation-client/metadata/automationMetadata";
import { MappedParameters } from "@atomist/automation-client";
import { MappedParameterResolver } from "../../binding/MappedParameterResolver";
import { parseOwnerAndRepo } from "../../binding/expandedTreeUtils";

export class CliMappedParameterResolver implements MappedParameterResolver {

    public resolve(md: MappedParameterDeclaration): string | undefined {
        switch (md.uri) {
            case MappedParameters.GitHubRepository :
                const { repo } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory, process.cwd());
                return repo;
            case MappedParameters.GitHubOwner :
                const { owner } = parseOwnerAndRepo(this.repositoryOwnerParentDirectory, process.cwd());
                return owner;
        }
        if (!md.required) {
            return undefined;
        }
    }

    constructor(private readonly repositoryOwnerParentDirectory: string) {}
}
