import "mocha";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { executeReview } from "../../../../../src/common/delivery/code/review/executeReview";
import { SingleProjectLoader } from "../../../SingleProjectLoader";
import { ReviewerRegistration } from "../../../../../src/common/delivery/code/codeActionRegistrations";
import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";
import { TruePushTest } from "../../../listener/support/pushTestUtilsTest";

const HatesTheWorld: ReviewerRegistration = {
    name: "hatred",
    pushTest: TruePushTest,
    action: async p => ({
        repoId: p.id,
        comments: await saveFromFiles(p, "**/*.*", f =>
            new DefaultReviewComment("info", "hater",
                `Found a file at \`${f.path}\`: We hate all files`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    }),
    options: { reviewOnlyChangedFiles: false,}
};

describe("executeReview", () => {

    // it("should be clean on empty", async () => {
    //     const p = InMemoryProject.of();
    //     const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld]);
    //     await ge(null, null, null);
    // });

});
