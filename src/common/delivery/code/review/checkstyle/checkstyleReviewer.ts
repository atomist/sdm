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

import {
    HandlerContext,
    logger,
} from "@atomist/automation-client";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { spawn } from "child_process";
import { IsJava } from "../../../../listener/support/pushtest/jvm/jvmPushTests";
import { ReviewerError } from "../ReviewerError";
import { ReviewerRegistration } from "../ReviewerRegistration";
import { extract } from "./checkstyleReportExtractor";
import { checkstyleReportToReview } from "./checkStyleReportToReview";

/**
 * Spawn Checkstyle Java process against the project directory.
 * Parse Checkstyle XML out and transform it into our ProjectReview structure.
 * An example of a common pattern for integrating third party static
 * analysis or security tools.
 * @param {string} checkstylePath the path to the CheckStyle jar on the local machine. (see README.md)
 */
export const checkstyleReviewer: (checkstylePath: string) =>
    (p: LocalProject, ctx: HandlerContext) => Promise<ProjectReview | ProjectReview> =
    (checkstylePath: string) => (p: GitProject, ctx: HandlerContext) => {
        // TODO switch to watchSpawned
        const childProcess = spawn(
            "java",
            ["-jar",
                checkstylePath,
                "-c",
                "/sun_checks.xml",
                "src/main/java",
                "-f",
                "xml",
            ],
            {
                cwd: p.baseDir,
            });
        let stdout = "";
        let stderr = "";
        childProcess.stdout.on("data", data => stdout += data.toString());
        childProcess.stderr.on("data", data => stderr += data.toString());

        return new Promise((resolve, reject) => {
            childProcess.on("error", err => {
                reject(err);
            });
            childProcess.on("exit", (code, signal) => {
                logger.info("Checkstyle ran on %j, code=%d, stdout=\n%s\nstderr=%s", p.id, code, stdout, stderr);
                if (code !== 0 && stdout === "") {
                    reject(new ReviewerError("CheckStyle", `Process returned ${code}: ${stderr}`, stderr));
                }
                return extract(stdout)
                    .then(cr => resolve(checkstyleReportToReview(p.id, cr, p.baseDir)),
                        err => reject(new ReviewerError("CheckStyle", err.msg, stderr)));
            });
        });
    };

export function checkstyleReviewerRegistration(considerOnlyChangedFiles: boolean): ReviewerRegistration {
    return {
        pushTest: IsJava,
        name: "Checkstyle",
        action: async cri => checkstyleReviewer(process.env.CHECKSTYLE_PATH)(cri.project, cri.context),
        options: {considerOnlyChangedFiles},
    };
}
