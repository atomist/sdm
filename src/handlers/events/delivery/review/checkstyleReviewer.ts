import { HandlerContext, logger } from "@atomist/automation-client";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { spawn } from "child_process";
import { extract } from "./checkstyleReportExtractor";
import { checkstyleReportToReview } from "./checkStyleReportToReview";

export const checkstyleReviewer: (checkstylePath: string) =>
    (p: LocalProject, ctx: HandlerContext) => Promise<ProjectReview | ProjectReview> =
    (checkstylePath: string) => (p: GitProject, ctx: HandlerContext) => {
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
            childProcess.on("exit", (code, signal) => {
                // TODO: if this did not exit cleanly, report that as an error somehow
                logger.info("Checkstyle ran on %j, code=%d, stdout=\n%s\nstderr=%s", p.id, code, stdout, stderr);
                return extract(stdout)
                    .then(cr =>
                        resolve(checkstyleReportToReview(p.id, cr, p.baseDir)));
            });
        });
    };
