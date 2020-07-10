/*
 * Copyright © 2020 Atomist, Inc.
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

import { SourceLocation } from "@atomist/automation-client/lib/operations/common/SourceLocation";
import { ProjectReview, ReviewComment, Severity } from "@atomist/automation-client/lib/operations/review/ReviewResult";
import { isLocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import * as path from "path";
import { spawnPromise } from "../../../api-helper/misc/child_process";
import { CodeInspection, CodeInspectionRegistration } from "../../../api/registration/CodeInspectionRegistration";
import { PackageJson } from "../util/PackageJson";

export interface EslintMessage {
    ruleId: string;
    severity: number;
    message: string;
    line: number;
    column: number;
}

export interface EslintResult {
    filePath: string;
    messages?: EslintMessage[];
}

export type EslintResults = EslintResult[];

export const esLintReviewCategory = "eslint";

function eslintReviewComment(
    detail: string,
    rule: string,
    severity: Severity = "info",
    sourceLocation?: SourceLocation,
): ReviewComment {
    return {
        category: esLintReviewCategory,
        detail,
        severity,
        sourceLocation,
        subcategory: rule,
    };
}

export function mapEslintResultsToReviewComments(tslintOutput: string, dir: string): ReviewComment[] {
    let results: EslintResults;
    try {
        results = JSON.parse(tslintOutput);
    } catch (e) {
        logger.error(`Failed to parse eslint output '${tslintOutput}': ${e.message}`);
        return [];
    }

    const comments = results
        .filter(r => !!r.messages && r.messages.length > 0)
        .map(r => {
            return r.messages.map(m => {
                const location: SourceLocation = {
                    path: r.filePath.replace(dir + path.sep, ""),
                    offset: undefined,
                    columnFrom1: m.column,
                    lineFrom1: m.line,
                };
                const severity = m.severity === 1 ? "warn" : "error";
                return eslintReviewComment(m.message, m.ruleId, severity, location);
            });
        });
    return _.flatten(comments);
}

export const RunEslintOnProject: CodeInspection<ProjectReview, NoParameters> = async (p: Project) => {
    const review: ProjectReview = { repoId: p.id, comments: [] };

    if (!isLocalProject(p)) {
        logger.error(`Project ${p.name} is not a local project`);
        return review;
    }

    const cwd = p.baseDir;

    const pj = await p.getFile("package.json");
    const rawPj: PackageJson = JSON.parse(await pj.getContent()) as PackageJson;

    let files: string[] = ["."];
    if (!!rawPj.scripts && !!rawPj.scripts.lint) {
        files = rawPj.scripts.lint.replace(/"/g, "").split(" ").slice(1);
    }
    const eslintArgs = [...files, "--format", "json"];

    // TODO does this work on windows?
    const eslintExe = path.join(cwd, "node_modules", ".bin", "eslint");
    try {
        const eslintResult = await spawnPromise(eslintExe, eslintArgs, { cwd });
        if (eslintResult.stderr) {
            logger.debug(`eslint standard error from ${p.name}: ${eslintResult.stderr}`);
        }
        const comments = mapEslintResultsToReviewComments(eslintResult.stdout, p.baseDir);
        review.comments.push(...comments);
    } catch (e) {
        logger.error(`Failed to run eslint: ${e.message}`);
    }

    return review;
};

/**
 * Provide a code inspection that runs eslint and returns a
 * ProjectReview.
 */
export const EslintInspection: CodeInspectionRegistration<ProjectReview, NoParameters> = {
    name: "EslintInspection",
    description: "Run eslint on project",
    inspection: RunEslintOnProject,
    intent: "eslint",
};
