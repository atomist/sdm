import { HandleCommand } from "@atomist/automation-client";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { EditMode, PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { DefaultDirectoryManager } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { EditOneOrAllParameters } from "./toclient/EditOneOrAllParameters";

export function editor<PARAMS extends EditOneOrAllParameters = EditOneOrAllParameters>(name: string,
                                                                                       edd: (params: PARAMS) => AnyProjectEditor,
                                                                                       description: string = name,
                                                                                       repoFinder: RepoFinder = allReposInTeam(),
                                                                                       repoLoader: (p: PARAMS) => RepoLoader =
                                                                                           p => gitHubRepoLoader(p.targets.credentials, DefaultDirectoryManager),
                                                                                       testEditMode?: EditMode): HandleCommand<EditOneOrAllParameters> {

    return editorHandler<PARAMS>(
        edd,

        // TODO this is nasty
        EditOneOrAllParameters as any,
        name, {
            repoFinder,
            repoLoader,
            description: "Upgrade versions of Spring Boot across an org",
            intent: `edit ${name}`,
            editMode: testEditMode || ((params: PARAMS) => new PullRequest(
                `edit-${name}-${Date.now()}`,
                description)),
        });
}
