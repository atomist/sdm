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

import { logger } from "@atomist/automation-client";
import { ProjectReview, Severity } from "@atomist/automation-client/operations/review/ReviewResult";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { PushTest } from "../../../api/mapping/PushTest";
import { ReviewerRegistration } from "../../../api/registration/ReviewerRegistration";

import * as _ from "lodash";

/**
 * Antipattern we'll look for. Can be defined as a regex or a string.
 */
export interface AntiPattern {
    name: string;
    antiPattern: RegExp | string;
    comment: string;
}

export interface PatternMatchReviewerOptions {

    /**
     * PushTest to narrow review applicability
     */
    pushTest?: PushTest;

    /**
     * Glob pattern for files to check
     */
    globPattern: string;

    category?: string;

    severity?: Severity;
}

/**
 * Return a ReviewerRegistration that objects to the given antipatterns and looks in the specified files
 * @param {string} name
 * @param opts targeting options
 * @param {AntiPattern} antiPatterns
 * @return {ReviewerRegistration}
 */
export function patternMatchReviewer(name: string,
                                     opts: PatternMatchReviewerOptions,
                                     ...antiPatterns: AntiPattern[]): ReviewerRegistration {
    return {
        name,
        pushTest: opts.pushTest,
        action: async cri => {
            logger.debug("Running regexp review '%s' on %s against %j", name, opts.globPattern, antiPatterns);
            const project = cri.project;
            const result: ProjectReview = {repoId: project.id, comments: []};
            await doWithFiles(project, opts.globPattern, async f => {
                const content = await f.getContent();
                antiPatterns.forEach(problem => {
                    const rex = typeof problem.antiPattern === "string" ?
                        new RegExp(_.escapeRegExp(problem.antiPattern)) :
                        problem.antiPattern;
                    if (rex.test(content)) {
                        logger.info("%s: Antipattern %s found in %s", name, problem.antiPattern, f.path);
                        result.comments.push({
                            severity: opts.severity || "error",
                            detail: problem.comment,
                            category: opts.category || name,
                            sourceLocation: {
                                path: f.path,
                                offset: undefined,
                                lineFrom1: findLineNumber(content, rex),
                            },
                        });
                    }
                });
            });
            return result;
        },
    };
}

function findLineNumber(source: string, regex: RegExp): number {
    const lines = source.split("\n");
    const lineFrom0 = lines.findIndex(l => regex.test(l));
    return lineFrom0 + 1;
}
