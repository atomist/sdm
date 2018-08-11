export { Project } from "@atomist/automation-client/project/Project";

export { File as ProjectFile } from "@atomist/automation-client/project/File";
export { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/project/mem/InMemoryFile";
export { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

export { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
export { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";

export * from "@atomist/automation-client/project/util/projectUtils";

import * as parseUtils from "@atomist/automation-client/project/util/parseUtils";

export { parseUtils };

import * as astUtils from "@atomist/automation-client/tree/ast/astUtils";

export { astUtils };

export { RemoteRepoRef, RepoId, RepoRef } from "@atomist/automation-client/operations/common/RepoId";
export { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

export * from "@atomist/automation-client/operations/edit/editModes";

export { GitProject } from "@atomist/automation-client/project/git/GitProject";
export { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";

export {
    DefaultReviewComment, ProjectReview, ReviewComment, ReviewResult, Severity,
} from "@atomist/automation-client/operations/review/ReviewResult";

import * as validationPatterns from "@atomist/automation-client/operations/common/params/gitHubPatterns";
export { validationPatterns };
