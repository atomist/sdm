/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export { Project } from "@atomist/automation-client/project/Project";

export { File as ProjectFile } from "@atomist/automation-client/project/File";
export { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/project/mem/InMemoryFile";
export { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

export { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
export { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";

export * from "@atomist/automation-client/project/util/projectUtils";

import * as validationPatterns from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import * as parseUtils from "@atomist/automation-client/project/util/parseUtils";
import * as astUtils from "@atomist/automation-client/tree/ast/astUtils";

export { parseUtils };

export { astUtils };

export { RemoteRepoRef, RepoId, RepoRef } from "@atomist/automation-client/operations/common/RepoId";
export { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

export * from "@atomist/automation-client/operations/edit/editModes";

export { GitProject } from "@atomist/automation-client/project/git/GitProject";
export { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";

export {
    DefaultReviewComment, ProjectReview, ReviewComment, ReviewResult, Severity,
} from "@atomist/automation-client/operations/review/ReviewResult";

export { validationPatterns };

export { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
