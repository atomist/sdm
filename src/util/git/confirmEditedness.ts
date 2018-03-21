import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";

export async function confirmEditedness(editResult: EditResult): Promise<EditResult> {
    if (editResult.edited === undefined) {
        const gs = await (editResult.target as GitProject).gitStatus();
        logger.debug("Git status: " + stringify(gs));
        return {
            ...editResult,
            edited: !gs.isClean,
        };
    } else {
        return editResult;
    }
}