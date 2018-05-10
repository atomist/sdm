
import { SourceRepoParameters } from "@atomist/automation-client/operations/common/params/SourceRepoParameters";
import { NewRepoCreationParameters } from "@atomist/automation-client/operations/generate/NewRepoCreationParameters";

/**
 * The parameters needed to create a new repo from a seed.
 */
export interface SeedDrivenGeneratorParameters {

    addAtomistWebhook: boolean;

    source: SourceRepoParameters;

    target: NewRepoCreationParameters;

}
