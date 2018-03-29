/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { ReviewerRegistration } from "../../../common/delivery/code/codeActionRegistrations";

const Problems = [{
    watchFor: `import sprintf from "sprintf-js"`,
    shouldBe: `import { sprintf } from "sprintf-js"`,
}];

export const CommonTypeScriptErrors: ReviewerRegistration = {
    name: "Dangerous TypeScript Errors of the Past",
    action: async (project: Project) => {
        const result: ProjectReview = {repoId: project.id, comments: []};
        await doWithFiles(project, "**/*.ts", async f => {
            const content = await f.getContent();
            Problems.forEach(problem => {
                if (content.includes(problem.watchFor)) {
                    result.comments.push({
                        severity: "error",
                        detail: "This has been a problem in the past: " + problem.watchFor,
                        category: "Dangerous TypeScript Errors of the Past",
                    });
                }
            });
        });
        return result;
    },
};
