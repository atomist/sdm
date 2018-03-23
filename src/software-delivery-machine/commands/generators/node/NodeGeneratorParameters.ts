import { MappedParameter, MappedParameters, Parameter } from "@atomist/automation-client";
import { BaseSeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/BaseSeedDrivenGeneratorParameters";

import { Parameters } from "@atomist/automation-client/decorators";
import { GeneratorConfig } from "../GeneratorConfig";

/**
 * Creates a GitHub Repo and installs Atomist collaborator if necessary
 */
@Parameters()
export class NodeGeneratorParameters extends BaseSeedDrivenGeneratorParameters {

    @MappedParameter(MappedParameters.SlackUserName)
    public screenName: string;

    @Parameter({
        displayName: "App name",
        description: "Application name",
        pattern: /^(@?[a-z][-a-z0-9_]*)$/,
        validInput: "a valid package.json application name, which starts with a lower-case letter and contains only " +
        " alphanumeric, -, and _ characters, or `${projectName}` to use the project name",
        minLength: 1,
        maxLength: 50,
        required: true,
        order: 51,
    })
    public appName: string;

    @Parameter({
        displayName: "Version",
        description: "initial version of the project, e.g., 1.2.3-SNAPSHOT",
        pattern: /^.*$/,
        validInput: "a valid semantic version, http://semver.org",
        minLength: 1,
        maxLength: 50,
        required: true,
        order: 52,
    })
    public version: string = "0.1.0";

    constructor(config: GeneratorConfig) {
        super();
        this.source.owner = config.seedOwner;
        this.source.repo = config.seedRepo;
    }
}
