import { MappedParameterDeclaration } from "@atomist/automation-client/metadata/automationMetadata";

export interface MappedParameterResolver {

    resolve(md: MappedParameterDeclaration): string | undefined;
}
