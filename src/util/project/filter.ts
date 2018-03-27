import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import * as tmp from "tmp-promise";
import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import { logger } from "@atomist/automation-client";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import * as fs from "fs";
import { promisify } from "util";

/**
 * Create a local copy on disk of this project that has only the relevant files
 * in it
 * @param {LocalProject} p
 * @param {string[]} globs to copy
 * @return {Promise<LocalProject>}
 */
export async function filtered(p: LocalProject, globs: string[]): Promise<LocalProject> {
    if (!globs) {
        logger.debug("Cannot filter project %j: No globs specified", p.id);
        return p;
    }
    const tmpDir = tmp.dirSync({unsafeCleanup: true}).name;
    logger.info("Filtered project %j at %d to %s", p.id, p.baseDir, tmpDir);
    await Promise.all(globs.map(glob =>
        doWithFiles(p, glob, async f => {
            await promisify(fs.copyFile)(
                p.baseDir + "/" + f.path,
                tmpDir + "/" + f.path);
        })));
    return new NodeFsLocalProject(p.id, tmpDir);
}
