import { HandlerContext } from "@atomist/automation-client";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { clean } from "@atomist/automation-client/operations/review/ReviewResult";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

export const logReview: ProjectReviewer = async (p: GitProject,
                                                 ctx: HandlerContext) => {
    // try {
    //     await p.findFile("pom.xml");
    //     return {passed: true};
    // } catch {
    //     return {passed: false, message: "This project has no pom. Cannot deploy"};
    // }
    console.log("REVIEWING THING");
    return clean(p.id);
};
