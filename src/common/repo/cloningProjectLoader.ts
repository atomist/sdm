import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ProjectLoader } from "./ProjectLoader";

/**
 * Non caching ProjectLoader that uses a separate clone for each project accessed
 */
export const CloningProjectLoader: ProjectLoader = {
    async doWithProject(coords, action) {
        const p = await GitCommandGitProject.cloned(coords.credentials, coords.id);
        return action(p);
    },
};
