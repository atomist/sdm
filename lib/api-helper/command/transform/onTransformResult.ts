/*
 * Copyright © 2019 Atomist, Inc.
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

import { EditMode } from "@atomist/automation-client";
import {
    isBranchCommit,
    isPullRequest,
} from "@atomist/automation-client/lib/operations/edit/editModes";
import {
    Attachment,
    Field,
    SlackMessage,
} from "@atomist/slack-messages";
import { CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { TransformResult } from "../../../api/registration/CodeTransform";
import {
    slackErrorMessage,
    slackInfoMessage,
    slackSuccessMessage,
} from "../../misc/slack/messages";

/**
 * This is a useful function to pass to CodeTransformRegistration.onTransformResults.
 * It sends a message per repository describing any errors that occurred while saving the transforms,
 * and also where the transform was applied. It gives you the branch name.
 * @param trs results of transforms
 * @param cli original command invocation
 */
export async function announceTransformResults(
    trs: TransformResult[],
    cli: CommandListenerInvocation): Promise<void> {

    const messages = trs.map(tr => {
        const projectId = tr.target.id;
        const title = `${projectId.owner}/${projectId.repo}`;
        if (tr.error) {
            return slackErrorMessage(title,
                "Failure in " + cli.commandName + "\n```\n" + tr.error.message + "\n```",
                cli.context, {
                    author_name: title,
                    author_link: tr.target.id.url,
                });
        }
        if (tr.edited) {
            return slackSuccessMessage(title,
                "Successfully applied " + cli.commandName,
                {
                    fields: fromEditMode(tr.editMode),
                    author_name: title,
                    author_link: tr.target.id.url,
                },
            );
        }
        return slackInfoMessage(title,
            "No changes made by " + cli.commandName,
            {
                author_name: title,
                author_link: tr.target.id.url,
            });

    });
    await asyncForEach(messages, message =>
        cli.addressChannels(message));
}

async function asyncForEach<T, R>(array: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
    return Promise.all(array.map(fn));
}

function fromEditMode(editMode?: EditMode): Field[] {
    if (!editMode) {
        return [];
    }
    const fields: Field[] = [];
    if (isBranchCommit(editMode)) {
        fields.push({
            title: "branch",
            value: editMode.branch,
            short: false,
        });
    }
    if (isPullRequest(editMode)) {
        fields.push({
            title: "Pull Request title",
            value: editMode.title,
            short: false,
        });
        if (!!editMode.targetBranch) {
            fields.push({
                title: "target branch",
                value: editMode.targetBranch,
                short: false,
            });
        }
        if (!!editMode.autoMerge) {
            fields.push({
                title: "AutoMerge mode",
                value: editMode.autoMerge.mode,
                short: false,
            });
            if (!!editMode.autoMerge.method) {
                fields.push({
                    title: "AutoMerge method",
                    value: editMode.autoMerge.method,
                    short: false,
                });
            }
        }
    }
    return fields;
}
