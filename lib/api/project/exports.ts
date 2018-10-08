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

export { Project } from "@atomist/automation-client/lib/project/Project";

export { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
export { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
export { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";

export { LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
export { NodeFsLocalProject } from "@atomist/automation-client/lib/project/local/NodeFsLocalProject";

export * from "@atomist/automation-client/lib/project/util/projectUtils";

import * as parseUtils from "@atomist/automation-client/lib/project/util/parseUtils";
import * as astUtils from "@atomist/automation-client/lib/tree/ast/astUtils";

export { parseUtils };

export { astUtils };

export { RemoteRepoRef, RepoId, RepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
export { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";

export * from "@atomist/automation-client/lib/operations/edit/editModes";

export { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
export { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";

export {
    DefaultReviewComment, ProjectReview, ReviewComment, ReviewResult, Severity,
} from "@atomist/automation-client/lib/operations/review/ReviewResult";

export { SeedDrivenGeneratorParameters } from "@atomist/automation-client/lib/operations/generate/SeedDrivenGeneratorParameters";
