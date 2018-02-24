import { HandleCommand } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { NewBranchWithStatus } from "../toclient/NewBranchWithStatus";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Status } from "../toclient/ghub";
import { SpringBootGeneratorParameters } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { UnleashPhilParameters } from "@atomist/spring-automation/commands/editor/spring/unleashPhil";

export const DryRunContext = "atomist-dry-run";

/**
 * Edit setting a status
 * @param {(params: PARAMS) => AnyProjectEditor} edd
 * @param {string} name
 * @param {Partial<EditorCommandDetails>} details
 * @return {HandleCommand<EditOneOrAllParameters>}
 */
export function dryRunEditor<PARAMS extends EditOneOrAllParameters =
    EditOneOrAllParameters>(edd: (params: PARAMS) => AnyProjectEditor,
                            name: string,
                            details: Partial<EditorCommandDetails<PARAMS>> = {}): HandleCommand<EditOneOrAllParameters> {
    const description = details.description || name;
    const status: Status = {
        context: DryRunContext,
        target_url: "https://www.atomist.com",
        description,
        state: "pending",
    };
    const detailsToUse: EditorCommandDetails = {
        description,
        intent: `try edit ${name}`,
        repoFinder: allReposInTeam(),
        repoLoader:
            p => gitHubRepoLoader(p.targets.credentials, DefaultDirectoryManager),
        editMode: ((params: PARAMS) => new NewBranchWithStatus(
            `edit-${name}-${Date.now()}`,
            description,
            params.targets.credentials,
            status)),
        ...details,
    };
    return editorHandler<PARAMS>(
        edd,
        UnleashPhilParameters as any,
        name,
        detailsToUse);
}
