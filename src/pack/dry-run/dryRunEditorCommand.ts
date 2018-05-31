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

import { HandleCommand, logger } from "@atomist/automation-client";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { EditOneOrAllParameters } from "@atomist/automation-client/operations/common/params/EditOneOrAllParameters";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { GitHubFallbackReposParameters } from "@atomist/automation-client/operations/common/params/GitHubFallbackReposParameters";
import { EditorCommandDetails, editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { allReposInTeam } from "../../api-helper/command/editor/allReposInTeam";
import { toEditorOrReviewerParametersMaker } from "../../api-helper/command/editor/editorCommand";
import { chattyEditorFactory } from "../../api-helper/command/editor/editorWrappers";
import { projectLoaderRepoLoader } from "../../api-helper/machine/projectLoaderRepoLoader";
import { MachineOrMachineOptions, toMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { EditModeSuggestion } from "../../api/command/editor/EditModeSuggestion";
import { EmptyParameters } from "../../api/command/support/EmptyParameters";
import { Status } from "../../util/github/ghub";
import { NewBranchWithStatus } from "./support/NewBranchWithStatus";

export const DryRunContext = "atomist-dry-run";

/**
 * Wrap an editorCommand in a command handler that sets a dry run status.
 * Typically used to wait for build success or failure, resulting in issue or PR.
 * Allows use of custom parameters as in editorCommand
 * Targeting (targets property) is handled automatically if the parameters
 * do not implement TargetsParams
 * @param sdm sdm machine or machine options
 * @param edd function to make a fresh editorCommand instance from the params
 * @param name editorCommand name
 * @param paramsMaker parameters factory, typically the name of a class with a no arg constructor
 * @param details optional details to customize behavior
 * @param targets targets parameters. Allows targeting to other source control systems
 * Add intent "try edit <name>"
 */
export function dryRunEditorCommand<PARAMS = EmptyParameters>(
    sdm: MachineOrMachineOptions,
    edd: (params: PARAMS) => AnyProjectEditor,
    name: string,
    paramsMaker: Maker<PARAMS> = EmptyParameters as Maker<PARAMS>,
    details: Partial<EditorCommandDetails<PARAMS>> = {},
    targets: FallbackParams =
        new GitHubFallbackReposParameters()): HandleCommand<EditOneOrAllParameters> {
    if (!!details.editMode) {
        throw new Error("Cannot set editMode for dryRunEditorCommand");
    }
    const detailsToUse: EditorCommandDetails = {
        description: details.description || name,
        intent: `try edit ${name}`,
        repoFinder: allReposInTeam(toMachineOptions(sdm).repoRefResolver),
        repoLoader:
            p => projectLoaderRepoLoader(toMachineOptions(sdm).projectLoader, p.targets.credentials),
        editMode: ((params: PARAMS & EditorOrReviewerParameters) => {
            logger.info("About to create edit mode for dry run editorCommand: params=%j", params);
            const description = (params as any as EditModeSuggestion).desiredPullRequestTitle || details.description || name;
            const status: Status = {
                context: DryRunContext,
                target_url: "https://www.atomist.com",
                description,
                state: "pending",
            };
            return new NewBranchWithStatus(
                (params as any as EditModeSuggestion).desiredBranchName || `edit-${name}-${Date.now()}`,
                toAtomistCommitMessage((params as any as EditModeSuggestion).desiredCommitMessage || description.substr(0, 50), description),
                params.targets.credentials,
                status);
        }),
        ...details,
    };
    return editorHandler(
        chattyEditorFactory(name, edd) as any,
        toEditorOrReviewerParametersMaker(paramsMaker, targets),
        name,
        detailsToUse);
}

function toAtomistCommitMessage(base: string, description: string) {
    return `${base}\n\n[atomist] ${description}`;
}
