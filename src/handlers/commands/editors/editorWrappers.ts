
import { logger } from "@atomist/automation-client";
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
        try {
            const er = await underlyingEditor(project, context, parms);
            const status = await project.gitStatus();
            if (status.isClean) {
                await context.messageClient.respond("Nothing to do");
            }
            return er as any;
        } catch (err) {
            await context.messageClient.respond("Nothing done");
            logger.warn("Editor error acting on %j: %s", project.id, err);
            return { target: project, edited: false, success: false } as EditResult;
        }
    };
}
