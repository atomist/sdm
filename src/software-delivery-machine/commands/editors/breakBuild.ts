import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { Project } from "@atomist/automation-client/project/Project";
import { editor } from "../../../handlers/commands/editors/registerEditor";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";

export const BadJavaFileName = "src/main/java/Bad.java";

export const breakBuildEditor: HandleCommand<any> = editor(
    () => breakBuild,
    "breakBuild", {
        editMode: {message: `You asked me to break the build!`, branch: "master"} as BranchCommit,
    });

async function breakBuild(p: Project, ctx: HandlerContext) {
    return await p.addFile(BadJavaFileName, "this is not Java");
}

export const unbreakBuildEditor: HandleCommand<any> = editor(
    () => unbreakBuild,
    "unbreakBuild", {
        editMode: {message: `Unbreaking the build`, branch: "master"} as BranchCommit,
    });

async function unbreakBuild(p: Project, ctx: HandlerContext) {
    return await p.deleteFile(BadJavaFileName);
}
