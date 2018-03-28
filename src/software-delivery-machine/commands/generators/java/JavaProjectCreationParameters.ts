import { MappedParameter, MappedParameters, Parameter } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { BaseSeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/BaseSeedDrivenGeneratorParameters";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { JavaPackageRegExp, MavenArtifactIdRegExp, MavenGroupIdRegExp } from "./javaPatterns";
import { SemVerRegExp } from "./commonPatterns";

/**
 * Superclass for all Java seeds using Maven. Updates Maven pom
 * based on parameters.
 */
@Parameters()
export class JavaProjectCreationParameters extends BaseSeedDrivenGeneratorParameters
    implements SmartParameters, VersionedArtifact {

    @Parameter({
        ...MavenArtifactIdRegExp,
        required: false,
        order: 51,
    })
    public artifactId: string = "";

    @Parameter({
        ...MavenGroupIdRegExp,
        required: true,
        order: 50,
    })
    public groupId: string;

    @Parameter({
        ...SemVerRegExp,
        required: true,
        order: 52,
    })
    public version: string = "0.1.0-SNAPSHOT";

    @Parameter({
        ...JavaPackageRegExp,
        required: true,
        order: 53,
    })
    public rootPackage: string;

    @MappedParameter(MappedParameters.SlackTeam)
    public slackTeam: string;

    get description() {
        return this.target.description;
    }

    public bindAndValidate() {
        if (!this.artifactId) {
            this.artifactId = this.target.repo;
        }
    }

}
