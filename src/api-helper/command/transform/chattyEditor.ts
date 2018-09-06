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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import {
    AnyProjectEditor,
    EditResult,
    ProjectEditor,
    toEditor,
} from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { TransformResult } from "../../../api/registration/CodeTransform";
import { confirmEditedness } from "./confirmEditedness";

/**
 * By default, the result of a code transform is a message about its activity.
 */
export function reportTransformResults(editorName) {

    function messageAboutEditResult(editResult: TransformResult): string {
        const target = editResult.target.id;
        const targetDescription = `${target.owner}/${target.repo}` +
            (looksDefault(target.branch) ? "" : "#" + target.branch);
        if (!editResult.success) {
            return `${targetDescription}: *${editorName}*: Nothing done`;
        }
        if (!editResult.edited) {
            return `${targetDescription}: *${editorName}*: Nothing to do`;
        }
        if (committedToBranch(editResult)) {
            return `${targetDescription}: *${editorName}*: Commit made on branch ${committedToBranch(editResult)}`;
        }
        return `${targetDescription}: *${editorName}* Success`;
    }

    return (results: TransformResult[], ci: CommandListenerInvocation) => {
        const messages = results.map(messageAboutEditResult);
        return ci.addressChannels(messages.sort().join("\n"));
    };
}

function committedToBranch(editResult): string | undefined {
    return editResult.editMode && editResult.editMode.branch;
}

function looksDefault(branch: string) {
    return !branch || ["HEAD", "master"].includes(branch);
}

/**
 * Wrap this transform to make it chatty, so it responds to
 * Slack if there's nothing to do
 * @param editorName name of the editor
 * @param {AnyProjectEditor} underlyingEditor
 */
export function chattyEditor(editorName: string, underlyingEditor: AnyProjectEditor): ProjectEditor {
    return async (project: GitProject, context, parms) => {
        const id = project.id as RemoteRepoRef;
        try {
            const tentativeEditResult = await toEditor(underlyingEditor)(project, context, parms);
            const editResult = await confirmEditedness(tentativeEditResult);
            logger.debug("chattyEditor %s: git status on %j is %j: editResult=%j", editorName, project.id, await project.gitStatus(), editResult);
            if (!editResult.edited) {
                await context.messageClient.respond(`*${editorName}*: Nothing to do on \`${id.url}\``);
            }
            return editResult;
        } catch (err) {
            await context.messageClient.respond(`*${editorName}*: Nothing done on \`${id.url}\``);
            logger.warn("Editor error acting on %j: %s", project.id, err);
            return { target: project, edited: false, success: false } as EditResult;
        }
    };
}
