import { logger } from "@atomist/automation-client";
import { successOn } from "@atomist/automation-client/action/ActionResult";
import { ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import * as fs from "fs";

export function fileSystemProjectPersister(repositoryOwnerParentDirectory: string): ProjectPersister {
    return async (p, _, id) => {
        const baseDir = `${repositoryOwnerParentDirectory}/${id.owner}/${id.repo}`;
        logger.info("Persisting to [%s]", baseDir);
        if (fs.existsSync(baseDir)) {
            throw new Error(`Cannot write new project to [${baseDir}] as this directory already exists`);
        }

        await NodeFsLocalProject.copy(p, baseDir);
        return successOn(p);
    };
}
