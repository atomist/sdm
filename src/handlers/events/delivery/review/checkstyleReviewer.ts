import { HandlerContext, logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { spawn } from "child_process";
import { extract } from "./checkstyleReportExtractor";
import { checkstyleReportToReview } from "./checkStyleReportToReview";

// TODO pass in an environment variable
export const checkstyleReviewer: (checkstylePath: string) =>
    (p: LocalProject, ctx: HandlerContext) => Promise<ProjectReview | ProjectReview> =
    (checkstylePath: string) => (p: GitProject, ctx: HandlerContext) => {
        const childProcess = spawn(
            "java",
            [ "-jar",
                `${checkstylePath}/checkstyle-8.8-all.jar`,
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
                logger.info("Checkstyle ran on %j, code=%d, stdout=\n%s\nstderr=%s", p.id, code, stdout, stderr);
                //if (code === 0) {
                    return extract(stdout)
                        .then(cr =>
                            resolve(checkstyleReportToReview(p.id, cr, p.baseDir)), reject);
                // }
                // reject(code);
            });
        });
    };
