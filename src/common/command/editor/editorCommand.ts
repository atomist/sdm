/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import * as assert from "power-assert";
import { EmptyParameters } from "../EmptyParameters";
import { EditModeSuggestion } from "./EditModeSuggestion";
import { chattyEditorFactory } from "./editorWrappers";

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
            (params as any as EditModeSuggestion).desiredBranchName || `edit-${name}-${Date.now()}`,
            (params as any as EditModeSuggestion).desiredPullRequestTitle || description)),
        ...details,
    };

    return editorHandler(
        chattyEditorFactory(name, edd) as any,
        toEditorOrReviewerParametersMaker<PARAMS>(paramsMaker),
        name,
        detailsToUse);
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
export function toEditorOrReviewerParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>): Maker<EditorOrReviewerParameters & PARAMS> {
    const sampleParams = toFactory(paramsMaker)();
    return isEditorOrReviewerParameters(sampleParams) ?
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
