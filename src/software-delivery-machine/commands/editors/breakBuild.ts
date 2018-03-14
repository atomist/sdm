import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { editorCommand, EmptyParameters } from "../../../handlers/commands/editors/editorCommand";

export const BadJavaFileName = "src/main/java/Bad.java";

export const breakBuildEditor: HandleCommand<any> = editorCommand(
    () => breakBuild,
    "breakBuild",
    EmptyParameters,
    {
        editMode: commitToMaster(`You asked me to break the build!`),
    });

async function breakBuild(p: Project, ctx: HandlerContext) {
    return await p.addFile(BadJavaFileName, "this is not Java");
}

export const unbreakBuildEditor: HandleCommand<any> = editorCommand(
    () => unbreakBuild,
    "unbreakBuild",
    EmptyParameters,
    {
        editMode: commitToMaster(`Trying to unbreak the build!`),
    });

async function unbreakBuild(p: Project, ctx: HandlerContext) {
    return await p.deleteFile(BadJavaFileName);
}
