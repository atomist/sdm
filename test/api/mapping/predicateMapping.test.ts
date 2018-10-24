import { whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import { FalsePushTest, TruePushTest } from "./support/pushTestUtils.test";
import { not } from "../../../lib/api/mapping/support/pushTestUtils";
import { PredicateMappingVisitor, visitPredicateMappings } from "../../../lib/api/mapping/PredicateMapping";
import * as assert from "assert";

describe("predicateMappingVisitor", () => {

    it("should visit no structure without error", () => {
        let count = 0;
        const v: PredicateMappingVisitor<any> = pm => {
            ++count;
            return true;
        };
        visitPredicateMappings(TruePushTest, v);
        assert.strictEqual(count, 1);
    });

    it("should visit some", () => {
        const wps = whenPushSatisfies(TruePushTest, FalsePushTest, not(TruePushTest));
        let count = 0;
        const v: PredicateMappingVisitor<any> = () => {
            ++count;
            return true;
        };
        visitPredicateMappings(wps.pushTest, v);
        assert.strictEqual(count, 5, "Should include intermediate nodes");
    });
});
