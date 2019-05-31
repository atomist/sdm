import {
    GitProject,
    logger,
    projectUtils,
} from "@atomist/automation-client";
import * as path from "path";

/**
 * Dynamically load contributions from the provided project
 *
 * Contributions can be AutofixRegistrations or CodeInspections.
 */
export async function loadProjectContributions<T>(project: GitProject,
                                                  subdirectory: string,
                                                  variable: string): Promise<T[]> {
    require('ts-node').register({ skipProject: true });

    const visited: string[] = [];

    return (await projectUtils.gatherFromFiles<T>(
        project,
        [`**/${subdirectory}/*.ts`, `**/${subdirectory}/*.js`],
        async f => {
            if (f.path.endsWith(".d.ts") || f.path.endsWith(".d.js")) {
                return undefined;
            }
            const baseName = f.path.replace(/\.ts/, "").replace(/\.js/, "");
            if (visited.includes(baseName)) {
                return undefined;
            } else {
                visited.push(baseName);
            }

            try {
                const content = (require(path.join(project.baseDir, f.path)))[variable];
                if (!!content) {
                    return content as T;
                } else {
                    logger.debug("Project file '%s' didn't export '%s' variable", f.path, variable);
                }
            } catch (e) {
                logger.warn("Failed to load project contribution from '%s': %s", f.path, e.message);
            }
            return undefined;

        })).filter(r => !!r);
}
