/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandleCommand } from "@atomist/automation-client";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { NoParameters, SmartParameters } from "@atomist/automation-client/SmartParameters";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { EditModeSuggestion } from "../../../api/command/target/EditModeSuggestion";
import { RepoTargets } from "../../../api/machine/RepoTargets";
import { projectLoaderRepoLoader } from "../../machine/projectLoaderRepoLoader";
import { isRepoTargetingParameters, RepoTargetingParameters } from "../../machine/RepoTargetingParameters";
import { MachineOrMachineOptions, toMachineOptions } from "../../machine/toMachineOptions";
import { chattyEditorFactory } from "./editorWrappers";

/**
 * Wrap an editor in a command handler, allowing use of custom parameters.
 * Targeting (targets property) is handled automatically if the parameters
 * do not implement TargetsParams
 * @param sdm machine or options
 * @param edd function to make a fresh editor instance from the params
 * @param name editor name
 * @param paramsMaker parameters factory, typically the name of a class with a no arg constructor
 * @param targets targets parameters. Allows targeting to other source control systems
 * @param details optional details to customize behavior
 * Add intent "edit <name>"
 */
export function editorCommand<PARAMS = NoParameters>(
    sdm: MachineOrMachineOptions,
    edd: (params: PARAMS) => AnyProjectEditor,
    name: string,
    paramsMaker: Maker<PARAMS> = NoParameters as Maker<PARAMS>,
    details: Partial<EditorCommandDetails> = {},
    targets: Maker<RepoTargets>): HandleCommand<EditOneOrAllParameters> {
    const description = details.description || name;
    const detailsToUse: EditorCommandDetails = {
        description,
        intent: `edit ${name}`,
        repoFinder: toMachineOptions(sdm).repoFinder,
        repoLoader:
            p => projectLoaderRepoLoader(toMachineOptions(sdm).projectLoader, p.targets.credentials),
        editMode: ((params: PARAMS) => new PullRequest(
            (params as any as EditModeSuggestion).desiredBranchName || `edit-${name}-${Date.now()}`,
            (params as any as EditModeSuggestion).desiredPullRequestTitle || description)),
        ...details,
    };

    return editorHandler(
        chattyEditorFactory(name, edd) as any,
        toRepoTargetingParametersMaker<PARAMS>(paramsMaker, targets) as any as Maker<EditorOrReviewerParameters>,
        name,
        detailsToUse);
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @param targets targets parameters to set if necessary
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
export function toRepoTargetingParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>,
                                                       targets: Maker<RepoTargets>): Maker<RepoTargetingParameters & PARAMS> {
    const sampleParams = toFactory(paramsMaker)();
    return isRepoTargetingParameters(sampleParams) ?
        paramsMaker as Maker<RepoTargetingParameters & PARAMS> :
        () => {
            const rawParms: PARAMS = toFactory(paramsMaker)();
            const allParms = rawParms as RepoTargetingParameters & PARAMS & SmartParameters;
            const targetsInstance: RepoTargets = toFactory(targets)();
            allParms.targets = targetsInstance;
            if (!!allParms.targets.bindAndValidate) {
                allParms.bindAndValidate = () => {
                    allParms.targets.bindAndValidate();
                };
            }
            return allParms;
        };
}
