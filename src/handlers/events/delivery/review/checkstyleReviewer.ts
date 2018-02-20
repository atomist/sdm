import { HandlerContext, logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

export const checkstyleReviewer: (checkstylePath: string) =>
    (p: GitProject, ctx: HandlerContext) => Promise<ProjectReview | ProjectReview> =
    (checkstylePath: string) => (p: GitProject, ctx: HandlerContext) => {
        return runCommand(`java -jar ${checkstylePath}/checkstyle-8.8-all.jar -c /sun_checks.xml src/main/java -f xml`,
            {
                cwd: p.baseDir,
            })
            .then(cr => {
                logger.info("Checkstyle ran ok on $j", p.id);
                console.log("***************\n" + cr.stdout);
                return clean(p.id);
            })
            .catch(err => {
                logger.info("Checkstyle failed on $j with %s", p.id, err);
                console.log("***************\n" + err);
                return clean(p.id);
            });
    };
