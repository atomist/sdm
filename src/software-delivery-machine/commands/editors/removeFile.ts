import { HandleCommand, HandlerContext, Parameter } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { editorCommand } from "../../../handlers/commands/editors/editorCommand";

@Parameters()
export class RemoveFileParams {

    @Parameter()
    public path: string;
}

export const removeFileEditor: HandleCommand = editorCommand<RemoveFileParams>(
    () => removeFile,
    "remove file",
    RemoveFileParams,
    {
        editMode: params => commitToMaster(`You asked me to remove file ${params.path}!`),
    });

async function removeFile(p: Project, ctx: HandlerContext, params: RemoveFileParams) {
    return await p.deleteFile(params.path);
}
