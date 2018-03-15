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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AnyProjectEditor, EditResult, ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

/**
 * Decorate an editor factory to make editors it creates chatty, so they respond to
 * Slack if there's nothing to do
 * @param {(params: PARAMS) => AnyProjectEditor} f
 * @return {(params: PARAMS) => AnyProjectEditor}
 */
export function chattyEditorFactory<PARAMS>(f: (params: PARAMS) => AnyProjectEditor): (params: PARAMS) => ProjectEditor {
    return params => {
        const underlyingEditor: AnyProjectEditor = f(params);
        return chattyEditor(underlyingEditor);
    };
}

/**
 * Wrap this editor to make it chatty, so it responds to
 * Slack if there's nothing to do
 * @param {AnyProjectEditor} underlyingEditor
 * @return {(project: GitProject, context, parms) => Promise<any | EditResult>}
 */
export function chattyEditor(underlyingEditor: AnyProjectEditor): ProjectEditor {
    return async (project: GitProject, context, parms) => {
        const id = project.id as RemoteRepoRef;
        try {
            const er = await underlyingEditor(project, context, parms);
            const status = await project.gitStatus();
            if (status.isClean) {
                await context.messageClient.respond(`Nothing to do on \`${id.url}\``);
            }
            return er as any;
        } catch (err) {
            await context.messageClient.respond(`Nothing done on \`${id.url}\``);
            logger.warn("Editor error acting on %j: %s", project.id, err);
            return { target: project, edited: false, success: false } as EditResult;
        }
    };
}
