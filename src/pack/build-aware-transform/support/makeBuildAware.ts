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

import { HandlerContext } from "@atomist/automation-client";
import { EditMode, isPullRequest, toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { EditModeSuggestion } from "../../../api/command/target/EditModeSuggestion";
import { CodeTransformRegistration, CodeTransformRegistrationDecorator } from "../../../api/registration/CodeTransformRegistration";

export const DryRunMessage = "[atomist-dry-run]";

/**
 * Return a function wrapping a CodeTransform registration to make
 * it build aware: That is, perform a dry run branch push first
 * and create a PR or issue depending on the build result.
 * @return {CodeTransformRegistration}
 */
export const makeBuildAware: CodeTransformRegistrationDecorator<any> =
    ctr => {
        // Works by putting in a special commit message
        const dryRunRegistration: CodeTransformRegistration<any> = {
            ...ctr,
        };
        dryRunRegistration.editMode = p => {
            if (!!ctr.editMode) {
                const registeredEmf = toEditModeFactory(ctr.editMode);
                return dryRunOf(registeredEmf(p));
            } else {
                // No edit mode was set. We need to set one that sets a branch:
                // No PR for now
                const branch = (p as EditModeSuggestion).desiredBranchName || `${ctr.name}-${new Date().getTime()}`;
                const desiredCommitMessage = (p as EditModeSuggestion).desiredCommitMessage || dryRunMessage(ctr.description || ctr.name);
                return {
                    branch,
                    message: desiredCommitMessage + "\n\n" + DryRunMessage,
                    afterPersist: afterPersistFactory({
                        desiredCommitMessage,
                        desiredPullRequestTitle: (p as EditModeSuggestion).desiredPullRequestTitle || desiredCommitMessage,
                    }),
                };
            }
        };
        return dryRunRegistration;
    };

/**
 * Return a dry run form of this EditMode:
 * add the necessary dry run suffix and avoid it creating a PR if it wants to.
 * @param {EditMode} em
 * @return {EditMode}
 */
function dryRunOf(em: EditMode): EditMode {
    // Add dry run message suffix
    em.afterPersist = afterPersistFactory({ desiredCommitMessage: em.message, desiredPullRequestTitle: em.message });
    em.message = dryRunMessage(em.message) + "\n\n" + DryRunMessage;
    if (isPullRequest(em)) {
        // Don't let it raise a PR if it wanted to.
        // It will remain a valid BranchCommit if it was a PR
        em.title = em.body = undefined;
    }
    return em;
}

function dryRunMessage(oldMessage: string): string {
    return `Try to ${oldMessage}`;
}

function afterPersistFactory(ems: {
    desiredPullRequestTitle?: string,
    desiredCommitMessage?: string,
}): (p: Project, ctx: HandlerContext) => Promise<any> {
    return async (p: Project, ctx: HandlerContext) => {
        // TODO raise custom event here using info on edit mode
        process.stdout.write(`Persist custom event: message='${ems.desiredCommitMessage}', title='${ems.desiredPullRequestTitle}'\n`);
        return undefined;
    };
}
