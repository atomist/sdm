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
import {
    BuildContext,
    ProductionDeploymentContext, ProductionEndpointContext, ReviewContext, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../../src/common/delivery/goals/common/commonGoals";
import {BaseContext, contextIsAfter, splitContext} from "../../../../src/common/delivery/goals/gitHubContext";

describe("Goal handling", () => {

   it("parses my contexts", () => {
       const result = splitContext(ReviewContext);
       assert.equal(result.name, "review");
       assert.equal(result.base, BaseContext);
       assert.equal(result.env, "code");
       assert.equal(result.envOrder, 0);
       assert.equal(result.goalOrder, 1);
   });

   it("says endpoint is after deploy", () => {
       assert(contextIsAfter(StagingDeploymentContext, StagingEndpointContext));
   });

   it("says deploy is after build", () => {
       assert(contextIsAfter(BuildContext, StagingDeploymentContext));
   });

   it("says prod endpoint is after prod ", () => {
        assert(contextIsAfter(ProductionDeploymentContext, ProductionEndpointContext));
    });

});
