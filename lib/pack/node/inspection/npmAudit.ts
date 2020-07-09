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

import { ProjectReview, ReviewComment, Severity } from "@atomist/automation-client/lib/operations/review/ReviewResult";
import { isLocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { codeLine, italic } from "@atomist/slack-messages";
import * as _ from "lodash";
import { spawnPromise } from "../../../api-helper/misc/child_process";
import { AutoInspectRegistration } from "../../../api/registration/AutoInspectRegistration";
import { CodeInspection, CodeInspectionRegistration } from "../../../api/registration/CodeInspectionRegistration";
import { DefaultNpmAuditOptions, NpmAuditOptions } from "../autofix/npmAuditAutofix";
import { IsNode } from "../pushtest/nodePushTests";

export interface NpmAuditAdvisory {
    module_name: string;
    vulnerable_versions: string;
    severity: "info" | "low" | "moderate" | "high" | "critical";
    title: string;
    findings: Array<{ version: string; paths: string[] }>;
    cves: string[];
    url: string;
    recommendation: string;
}

export interface NpmAuditResult {
    actions: any[];
    advisories: { [id: string]: NpmAuditAdvisory };
}

export const npmAuditReviewCategory = "npm audit";

function npmAuditReviewComment(detail: string, rule: string, severity: Severity = "info"): ReviewComment {
    return {
        category: npmAuditReviewCategory,
        detail,
        severity,
        subcategory: rule,
    };
}

export function mapNpmAuditResultsToReviewComments(npmAuditOutput: string): ReviewComment[] {
    let results: NpmAuditResult;
    try {
        results = JSON.parse(npmAuditOutput);
    } catch (e) {
        logger.error(`Failed to parse npm audit output '${npmAuditOutput}': ${e.message}`);
        return [];
    }

    return _.map(results.advisories, v => {
        const rule = `${v.module_name}:${v.vulnerable_versions}`;
        let details = `[${v.title}](${v.url})`;
        if (!!v.recommendation) {
            details = `${details} ${italic(v.recommendation.trim())}`;
        }
        if (!!v.cves && v.cves.length > 0) {
            details = `${details} - ` + v.cves.map(c => `[${c}](https://nvd.nist.gov/vuln/detail/${c})`).join(" ");
        }
        if (!!v.findings && v.findings.length > 0) {
            const findings = v.findings.map(
                f =>
                    `\n  - ${codeLine(`${v.module_name}:${f.version}`)}: ${(f.paths || [])
                        .map(p => `\n    - ${codeLine(p)}`)
                        .join("")}`,
            );
            details = `${details} ${findings.join("")}`;
        }
        let severity: Severity;
        switch (v.severity) {
            case "info":
            case "low":
                severity = "info";
                break;
            case "moderate":
                severity = "warn";
                break;
            case "high":
            case "critical":
                severity = "error";
                break;
        }

        return npmAuditReviewComment(details, rule, severity);
    });
}

export function runNpmAuditOnProject(
    options: NpmAuditOptions = DefaultNpmAuditOptions,
): CodeInspection<ProjectReview, NoParameters> {
    return async (p: Project) => {
        const review: ProjectReview = { repoId: p.id, comments: [] };

        if (!isLocalProject(p)) {
            logger.error(`Project ${p.name} is not a local project`);
            return review;
        }

        const cwd = p.baseDir;

        const args = ["audit", "--json"];
        if (options.packageLockOnly === true) {
            args.push("--package-lock-only");
        }

        try {
            const npmAuditResult = await spawnPromise("npm", args, { cwd });
            if (npmAuditResult.stderr) {
                logger.debug(`npm audit standard error from ${p.name}: ${npmAuditResult.stderr}`);
            }
            const comments = mapNpmAuditResultsToReviewComments(npmAuditResult.stdout);
            review.comments.push(...comments);
        } catch (e) {
            logger.error(`Failed to run npm audit: ${e.message}`);
        }

        return review;
    };
}

/**
 * Provide a code inspection that runs `npm audit` and returns a
 * ProjectReview.
 */
export function npmAuditInspection(
    options: NpmAuditOptions = DefaultNpmAuditOptions,
): CodeInspectionRegistration<ProjectReview, NoParameters> {
    return {
        name: "NpmAuditInspection",
        description: "Run npm audit on project",
        inspection: runNpmAuditOnProject(options),
        intent: "npm audit",
    };
}

/**
 * Provide an auto inspect registration that runs `npm audit` and
 * returns a ProjectReview.
 */
export const NpmAuditAutoInspectRegistration: AutoInspectRegistration<ProjectReview, NoParameters> = {
    name: "NpmAuditAutoInspection",
    inspection: runNpmAuditOnProject(),
    pushTest: IsNode,
};
