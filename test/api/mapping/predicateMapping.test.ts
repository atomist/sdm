/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from "assert";
import { whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import {
    PredicateMappingVisitor,
    visitPredicateMappings,
} from "../../../lib/api/mapping/PredicateMapping";
import { not } from "../../../lib/api/mapping/support/pushTestUtils";
import {
    falsePushTest,
    TruePushTest,
} from "./support/pushTestUtils.test";

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
        const wps = whenPushSatisfies(TruePushTest, falsePushTest(), not(TruePushTest));
        let count = 0;
        const v: PredicateMappingVisitor<any> = () => {
            ++count;
            return true;
        };
        visitPredicateMappings(wps.pushTest, v);
        assert.strictEqual(count, 5, "Should include intermediate nodes");
    });
});
