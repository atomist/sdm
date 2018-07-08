import { defaultRepoLoader } from "@atomist/automation-client/operations/common/defaultRepoLoader";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { AllRepos, RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { doWithAllRepos } from "@atomist/automation-client/operations/common/repoUtils";
import { EditMode, EditModeFactory, toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { editRepo } from "@atomist/automation-client/operations/support/editorUtils";
import { Project } from "@atomist/automation-client/project/Project";
import { SdmContext } from "../../../api/context/SdmContext";
import { CodeTransform } from "../../../api/registration/ProjectOperationRegistration";
import { toProjectEditor } from "../../machine/handlerRegistrations";

/**
 * Edit all the given repos with the given editor
 * @param editInfo: EditMode determines how the edits should be applied.
 * Factory allows us to use different branches if necessary
 * @param parameters parameters (optional)
 * @param {RepoFinder} repoFinder
 * @param {} repoFilter
 * @param {RepoLoader} repoLoader
 * @return {Promise<Array<EditResult>>}
 */
export function transformAll<R, P extends EditorOrReviewerParameters>(ci: SdmContext,
                                                                      transform: CodeTransform<P>,
                                                                      editInfo: EditMode | EditModeFactory,
                                                                      parameters: P,
                                                                      repoFinder: RepoFinder,
                                                                      repoFilter: RepoFilter = AllRepos,
                                                                      repoLoader: RepoLoader =
                                                                          defaultRepoLoader(ci.credentials)): Promise<EditResult[]> {
    const edit = (p: Project, parms: P) =>
        editRepo(ci.context, p, toProjectEditor(transform), toEditModeFactory(editInfo)(p),
            parms);
    return doWithAllRepos<EditResult, P>(ci.context, ci.credentials, edit, parameters,
        repoFinder, repoFilter, repoLoader);
}

/**
 * Edit the given repo with the given editor function, which depends only on the project
 * @param editInfo: EditMode determines how the edits should be applied.
 * @param singleRepository reference to the single repo to edit
 * @param parameters parameters (optional)
 * @param {RepoLoader} repoLoader (optional, useful in testing)
 * @return {Promise<EditResult>}
 */
export function transformOne<P extends EditorOrReviewerParameters>(ci: SdmContext,
                                                                   transform: CodeTransform<P>,
                                                                   editInfo: EditMode,
                                                                   singleRepository: RepoRef,
                                                                   parameters?: P,
                                                                   repoLoader: RepoLoader = defaultRepoLoader(ci.credentials)): Promise<EditResult> {
    const singleRepoFinder: RepoFinder = () => Promise.resolve([singleRepository]);
    return transformAll(ci, transform, editInfo, parameters,
        singleRepoFinder, AllRepos, repoLoader)
        .then(ers => ers[0]);
}
