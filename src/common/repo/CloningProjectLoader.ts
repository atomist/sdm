import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ProjectLoader } from "./ProjectLoader";

/**
 * Non caching ProjectLoader
 */
export const CloningProjectLoader: ProjectLoader = {
    load(credentials, id, context) {
        return GitCommandGitProject.cloned(credentials, id);
    },
};
