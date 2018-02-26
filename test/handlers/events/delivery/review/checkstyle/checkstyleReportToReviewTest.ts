import "mocha";

import * as assert from "power-assert";

import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { extract } from "../../../../../../src/handlers/events/delivery/scan/review/checkstyle/checkstyleReportExtractor";
import { checkstyleReportToReview } from "../../../../../../src/handlers/events/delivery/scan/review/checkstyle/checkStyleReportToReview";
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
