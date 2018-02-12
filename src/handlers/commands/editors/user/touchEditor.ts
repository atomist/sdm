import { HandleCommand } from "@atomist/automation-client";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { editor } from "../registerEditor";
import { EditOneOrAllParameters } from "../toclient/EditOneOrAllParameters";

export const touchEditor: HandleCommand<any> = editor(
    () => appendToReadMe,
    "touch",
    {
        editMode: { message: `Touch repo`, branch: "master"} as BranchCommit,
    },
);

export const appendToReadMe: SimpleProjectEditor = (p, ctx, params) => {
    return ctx.messageClient.respond("Touching project")
        .then(() => doWithFiles(p, "README.md", f =>
            f.getContent().then(content =>
                f.setContent(`${content}\n${ctx.invocationId}\n`))));
};
