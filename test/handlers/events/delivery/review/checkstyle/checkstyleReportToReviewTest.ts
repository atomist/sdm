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

import * as assert from "power-assert";

import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { extract } from "../../../../../../src/common/delivery/code/review/checkstyle/checkstyleReportExtractor";
import { checkstyleReportToReview } from "../../../../../../src/common/delivery/code/review/checkstyle/checkStyleReportToReview";
import { xml2valid1 } from "./checkstyleReportExtractorTest";

describe("checkstyleReportToReview", () => {

    it("should parse valid output", async () => {
        const report = await extract(xml2valid1);
        const review = checkstyleReportToReview(
            new SimpleRepoId("a", "b"),
            report,
            "/Users/rodjohnson/tools/checkstyle-8.8/");
        assert(!!review);
        assert(review.comments.length === 4);
        assert(review.comments[0].sourceLocation.path === "Test.java");
        assert(review.comments[0].severity === "error");
        assert(review.comments[0].sourceLocation.lineFrom1 === 0);
        assert(review.comments[2].sourceLocation.path === "src/main/java/thing/Test2.java");
    });

});
