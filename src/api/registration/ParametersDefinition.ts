import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

/**
 * Define parameters used in a command
 */
export interface ParametersDefinition {

    readonly parameters: NamedParameter[];

    readonly mappedParameters: NamedMappedParameter[];

    readonly secrets: NamedSecret[];
}

export type NamedParameter = BaseParameter & { name: string };

export interface NamedSecret {
    name: string;
    uri: string;
}

export interface NamedMappedParameter {
    name: string;
    uri: string;
    required?: boolean;
}
