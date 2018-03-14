import { HandleCommand } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { GitHubFallbackReposParameters } from "@atomist/automation-client/operations/common/params/GitHubFallbackReposParameters";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";

import { Parameters } from "@atomist/automation-client/decorators";
import * as assert from "power-assert";

/**
 * Wrap an editor in a command handler, allowing use of custom parameters.
 * Targeting (targets property) is handled automatically if the parameters
 * do not implement TargetsParams
 * @param edd function to make a fresh editor instance from the params
 * @param name editor name
 * @param paramsMaker parameters factory, typically the name of a class with a no arg constructor
 * @param details optional details to customize behavior
 * Add intent "edit <name>"
 */
export function editorCommand<PARAMS = EmptyParameters>(edd: (params: PARAMS) => AnyProjectEditor,
                                                        name: string,
                                                        paramsMaker: Maker<PARAMS> = EmptyParameters as Maker<PARAMS>,
                                                        details: Partial<EditorCommandDetails> = {}): HandleCommand<EditOneOrAllParameters> {

    const description = details.description || name;
    const detailsToUse: EditorCommandDetails = {
        description,
        intent: `edit ${name}`,
        repoFinder: allReposInTeam(),
        repoLoader:
            p => gitHubRepoLoader(p.targets.credentials, DefaultDirectoryManager),
        editMode: ((params: PARAMS) => new PullRequest(
            `edit-${name}-${Date.now()}`,
            description)),
        ...details,
    };

    const sampleParams = toFactory(paramsMaker)();

    const paramsMakerToUse: Maker<EditorOrReviewerParameters & PARAMS> =
        isEditorOrReviewerParameters(sampleParams) ?
            paramsMaker as Maker<EditorOrReviewerParameters & PARAMS> :
            () => {
                const rawParms: PARAMS = toFactory(paramsMaker)();
                const allParms = rawParms as EditorOrReviewerParameters & PARAMS & SmartParameters;
                const targets = new GitHubFallbackReposParameters();
                allParms.targets = targets;
                allParms.bindAndValidate = () => {
                    validate(targets);
                };
                return allParms;
            };

    return editorHandler(
        edd as any,
        paramsMakerToUse,
        name,
        detailsToUse);
}

function isEditorOrReviewerParameters(p: any): p is EditorOrReviewerParameters {
    return !!(p as EditorOrReviewerParameters).targets;
}

function validate(targets: GitHubFallbackReposParameters) {
    if (!targets.repo) {
        assert(!!targets.repos, "Must set repos or repo");
        targets.repo = targets.repos;
    }
}

/**
 * Convenient empty parameters class
 */
@Parameters()
export class EmptyParameters {
}
