import { HandleCommand } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";

/**
 * Add intent "edit <name>"
 * @param {(params: PARAMS) => AnyProjectEditor} edd
 * @param {string} name
 * @param {Partial<EditorCommandDetails>} details
 * @return {HandleCommand<EditOneOrAllParameters>}
 */
export function editor<PARAMS extends EditOneOrAllParameters =
    EditOneOrAllParameters>(edd: (params: PARAMS) => AnyProjectEditor,
                            name: string,
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
    return editorHandler(
        edd,
        EditOneOrAllParameters,
        name,
        detailsToUse);
}
