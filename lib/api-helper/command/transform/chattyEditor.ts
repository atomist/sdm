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

import {
    GitProject,
    logger,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    AnyProjectEditor,
    EditResult,
    ProjectEditor,
    toEditor,
} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import {
    bold,
    codeBlock,
    italic,
} from "@atomist/slack-messages";
import {
    slackErrorMessage,
    slackInfoMessage,
} from "../../misc/slack/messages";
import { confirmEditedness } from "./confirmEditedness";

/**
 * Wrap this editor to make it chatty, so it responds to
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
                await context.messageClient.respond(
                    slackInfoMessage(
                        "Code Transform",
                        `Code transform ${italic(editorName)} made no changes to ${bold(`${id.owner}/${id.repo}`)}`));
            }
            return editResult;
        } catch (err) {
            await context.messageClient.respond(
                slackErrorMessage(
                    "Code Transform",
                    `Code transform ${italic(editorName)} failed while changing ${bold(`${id.owner}/${id.repo}`)}:\n\n${codeBlock(err.message)}`, context));
            logger.warn("Editor error acting on %j: %s", project.id, err);
            return <EditResult> { target: project, edited: false, success: false };
        }
    };
}
