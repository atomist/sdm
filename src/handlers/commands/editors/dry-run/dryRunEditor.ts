import { HandleCommand, logger } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { Status } from "../../../../util/github/ghub";
import { EditorCommandDetails, editorHandler } from "../toclient/editToCommand";
import { NewBranchWithStatus } from "./NewBranchWithStatus";

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
                            factory: Maker<PARAMS>,
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
        editMode: ((params: PARAMS) => {
            logger.info("About to create edit mode for dry run editor: params=%j", params);
            return new NewBranchWithStatus(
                `edit-${name}-${Date.now()}`,
                `${description.substr(0, 50)}\n\n[atomist] ${description}`,
                params.targets.credentials,
                status);
        }),
        ...details,
    };
    return editorHandler(
        edd,
        factory,
        name,
        detailsToUse);
}
