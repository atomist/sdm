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

import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";

import { ReviewerRegistration } from "../../../../../src/common/delivery/code/review/ReviewerRegistration";
import { TruePushTest } from "../../../listener/support/pushTestUtilsTest";

/* tslint:disable */

const HatesTheWorld: ReviewerRegistration = {
    name: "hatred",
    pushTest: TruePushTest,
    action: async cri => ({
        repoId: cri.project.id,
        comments: await saveFromFiles(cri.project, "**/*.*", f =>
            new DefaultReviewComment("info", "hater",
                `Found a file at \`${f.path}\`: We hate all files`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    }),
    options: { considerOnlyChangedFiles: false},
};

describe("executeReview", () => {

    // it("should be clean on empty", async () => {
    //     const p = InMemoryProject.of();
    //     const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld]);
    //     await ge(null, null, null);
    // });

});
