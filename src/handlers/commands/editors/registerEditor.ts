import { HandleCommand } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { FallbackReposParameters } from "@atomist/spring-automation/commands/editor/FallbackReposParameters";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { GitHubFallbackReposParameters } from "@atomist/automation-client/operations/common/params/GitHubFallbackReposParameters";

import * as assert from "power-assert";
import { Parameters } from "@atomist/automation-client/decorators";

/**
 * Add intent "edit <name>"
 */
export function editor<PARAMS = EmptyParameters>(edd: (params: PARAMS) => AnyProjectEditor,
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
    const combinedParamsMaker: Maker<EditorOrReviewerParameters & PARAMS> = () => {
        const rawParms: PARAMS = toFactory(paramsMaker)();
        const allParms = rawParms as EditorOrReviewerParameters & PARAMS & SmartParameters;
        const targets = new GitHubFallbackReposParameters();
        allParms.targets = targets;
        allParms.bindAndValidate = () => {
            validate(targets);
        };
        return allParms;
    };

    // TODO what if it's already of the right type?

    return editorHandler(
        edd as any,
        combinedParamsMaker,
        name,
        detailsToUse);
}

function validate(targets: GitHubFallbackReposParameters) {
    if (!targets.repo) {
        assert(!!targets.repos, "Must set repos or repo");
        targets.repo = targets.repos;
    }
}

@Parameters()
export class EmptyParameters {
}
