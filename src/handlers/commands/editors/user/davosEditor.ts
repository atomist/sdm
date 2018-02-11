import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../registerEditor";

export const davosEditor: HandleCommand<any> = editor(
    () => addDavosFile,
    "davos");

export const addDavosFile: SimpleProjectEditor = (p, ctx, params) => {
    return ctx.messageClient.respond("Looking at it: Davos")
        .then(() => p.addFile("davos", "WEF"));
};
