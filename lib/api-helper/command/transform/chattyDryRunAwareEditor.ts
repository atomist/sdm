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
    buttonForCommand,
    GitProject,
    HandlerContext,
    logger,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    AnyProjectEditor,
    ProjectEditor,
    toEditor,
} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import {
    bold,
    codeBlock,
    italic,
} from "@atomist/slack-messages";
import { execPromise } from "../../misc/child_process";
import {
    slackErrorMessage,
    slackInfoMessage,
} from "../../misc/slack/messages";
import { confirmEditedness } from "./confirmEditedness";

/**
 * Wrap this editor to make it chatty, so it responds to Slack if there's nothing to do.
 * It also honors the dryRun parameter flag to just capture the git diff and send it back to Slack instead
 * of pushing changes to Git.
 * @param editorName name of the editor
 * @param {AnyProjectEditor} underlyingEditor
 */
export function chattyDryRunAwareEditor(editorName: string,
                                        underlyingEditor: AnyProjectEditor): ProjectEditor {
    return async (project: GitProject, context: HandlerContext, params: any) => {
        const id = project.id as RemoteRepoRef;
        const slug = `${id.owner}/${id.repo}`;
        try {
            const tentativeEditResult = await toEditor(underlyingEditor)(project, context, params);
            const editResult = await confirmEditedness(tentativeEditResult);
            logger.debug("Code Transform %s: git status on '%j' is '%j': editResult=%j",
                editorName, project.id, await project.gitStatus(), editResult);

            // Figure out if this CodeTransform is running in dryRun mode; if so capture git diff and don't push changes
            if (!editResult.edited) {
                await context.messageClient.respond(
                    slackInfoMessage(
                        `Code Transform${isDryRun(params) ? " (dry run)" : ""}`,
                        `Code transform ${italic(editorName)} made no changes to ${bold(slug)}`));
            } else if (isDryRun(params)) {
                let diff = "";
                try {
                    const gitDiffResult = await execPromise("git", ["diff"], { cwd: project.baseDir });
                    diff = gitDiffResult.stdout;
                } catch (err) {
                    logger.error(`Error diffing project: %s`, err.message);
                    diff = `Error obtaining \`git diff\`: 

${codeBlock(err.message)}`;
                }
                await sendDryRunSummary(editorName, id, diff, params, context);
                return { target: project, edited: false, success: true };
            }
            return editResult;
        } catch (err) {
            await context.messageClient.respond(
                slackErrorMessage(
                    `Code Transform${isDryRun(params) ? " (dry run)" : ""}`,
                    `Code transform ${italic(editorName)} failed while changing ${bold(slug)}:\n\n${codeBlock(err.message)}`,
                    context));
            logger.warn("Code Transform error acting on %j: %s", project.id, err);
            return { target: project, edited: false, success: false };
        }
    };
}

/**
 * @deprecated use chattyDryRunAwareEditor
 */
export const chattyEditor = chattyDryRunAwareEditor;

function isDryRun(params: any): boolean {
    return !!params && params.dryRun === true;
}

async function sendDryRunSummary(codeTransformName: string,
                                 id: RemoteRepoRef,
                                 diff: string,
                                 params: any,
                                 ctx: HandlerContext): Promise<void> {
    const applyAction = {
        actions: [
            buttonForCommand(
                { text: "Apply Transform" },
                codeTransformName,
                {
                    // reuse the other parameters, but set the dryRun flag to false and pin to one repo
                    ...params,
                    dryRun: false,
                    "targets.sha": params.targets.sha,
                    "targets.owner": id.owner,
                    "targets.repo": id.repo,
                }),
        ],
    };
    const slug = `${id.owner}/${id.repo}`;

    await ctx.messageClient.respond(
        slackInfoMessage(
            `Code Transform (dry run)`,
            `Code transform ${italic(codeTransformName)} would make the following changes to ${bold(slug)}:
${codeBlock(diff)}
`, applyAction));
}