import "mocha";
import * as assert from "power-assert";
import {BaseContext, contextIsAfter, splitContext} from "../../../../src/common/phases/gitHubContext";
import {
    BuildContext,
    ProductionDeploymentContext, ProductionEndpointContext, ScanContext, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../../src/handlers/events/delivery/phases/httpServicePhases";

describe("Phase handling", () => {
   it("parses my contexts", () => {
       const result = splitContext(ScanContext);
       assert.equal(result.name, "scan");
       assert.equal(result.base, BaseContext);
       assert.equal(result.env, "code");
       assert.equal(result.envOrder, 0);
       assert.equal(result.name, "scan");
       assert.equal(result.phaseOrder, 1);
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
