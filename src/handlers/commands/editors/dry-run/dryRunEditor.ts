import { HandleCommand, logger } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { Status } from "../../../../util/github/ghub";
import { EmptyParameters, toEditorOrReviewerParametersMaker } from "../editorCommand";
import { EditorCommandDetails, editorHandler } from "../toclient/editToCommand";
import { NewBranchWithStatus } from "./NewBranchWithStatus";

export const DryRunContext = "atomist-dry-run";

/**
 * Wrap an editor in a command handler that sets a dry run status.
 * Typically used to wait for build success or failure, resulting in issue or PR.
 * Allows use of custom parameters as in editorCommand
 * Targeting (targets property) is handled automatically if the parameters
 * do not implement TargetsParams
 * @param edd function to make a fresh editor instance from the params
 * @param name editor name
 * @param paramsMaker parameters factory, typically the name of a class with a no arg constructor
 * @param details optional details to customize behavior
 * Add intent "try edit <name>"
 */
export function dryRunEditor<PARAMS = EmptyParameters>(edd: (params: PARAMS) => AnyProjectEditor,
                                                       paramsMaker: Maker<PARAMS> = EmptyParameters as Maker<PARAMS>,
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
        editMode: ((params: PARAMS & EditorOrReviewerParameters) => {
            logger.info("About to create edit mode for dry run editorCommand: params=%j", params);
            return new NewBranchWithStatus(
                `edit-${name}-${Date.now()}`,
                `${description.substr(0, 50)}\n\n[atomist] ${description}`,
                params.targets.credentials,
                status);
        }),
        ...details,
    };
    return editorHandler(
        edd as any,
        toEditorOrReviewerParametersMaker(paramsMaker),
        name,
        detailsToUse);
}
