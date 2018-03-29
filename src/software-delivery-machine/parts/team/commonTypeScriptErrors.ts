import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Project } from "@atomist/automation-client/project/Project";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { ReviewerRegistration } from "../../../common/delivery/code/codeActionRegistrations";

const Problems = [{
    watchFor: `import sprintf from "sprintf-js"`,
    shouldBe: `import { sprintf } from "sprintf-js"`
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
            })
        });
        return result;
    }
};
