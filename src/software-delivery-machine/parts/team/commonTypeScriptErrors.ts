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

import { logger } from "@atomist/automation-client";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { ReviewerRegistration } from "../../../common/delivery/code/review/ReviewerRegistration";

const Problems = [{
    watchFor: /^import sprintf from "sprintf-js"/m,
    shouldBe: `import { sprintf } from "sprintf-js"`,
}];

export const CommonTypeScriptErrors: ReviewerRegistration = {
    name: "Dangerous TypeScript Errors of the Past",
    action: async cri => {
        logger.debug("Running TypeScript code review");
        const project = cri.project;
        const result: ProjectReview = {repoId: project.id, comments: []};
        await doWithFiles(project, "**/*.ts", async f => {
            const content = await f.getContent();
            Problems.forEach(problem => {
                if (problem.watchFor.test(content)) {
                    logger.info("CommonTypeScriptErrors: Danger found in " + f.path);
                    result.comments.push({
                        severity: "error",
                        detail: "This: " + problem.watchFor + " should be: " + problem.shouldBe,
                        category: "Dangerous TypeScript Errors of the Past",
                        sourceLocation: {
                           path: f.path,
                           offset: undefined,
                           lineFrom1: findLineNumber(content, problem.watchFor),
                        },
                    });
                }
            });
        });
        return result;
    },
};

function findLineNumber(source: string, regex: RegExp): number {
    const lines = source.split("\n");
    const lineFrom0 = lines.findIndex(l => regex.test(l));
    return lineFrom0 + 1;
}
