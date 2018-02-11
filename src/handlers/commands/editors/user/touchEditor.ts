import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../registerEditor";
import { editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { EditOneOrAllParameters } from "../toclient/EditOneOrAllParameters";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";

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
