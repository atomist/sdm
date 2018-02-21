import "mocha";
import * as assert from "power-assert";
import {BaseContext, BuiltContext, contextIsAfter, ScanContext, splitContext} from "../../../../src/handlers/events/delivery/phases/gitHubContext";
import {CloudFoundryStagingDeploymentContext, StagingEndpointContext} from "../../../../src/handlers/events/delivery/phases/httpServicePhases";
import {ProductionDeploymentContext, ProductionEndpointContext} from "../../../../src/handlers/events/delivery/phases/productionDeployPhases";

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
       assert(contextIsAfter(CloudFoundryStagingDeploymentContext, StagingEndpointContext));
   });

   it("says deploy is after build", () => {
       assert(contextIsAfter(BuiltContext, CloudFoundryStagingDeploymentContext));
   });

    it("says prod endpoint is after prod ", () => {
        assert(contextIsAfter(ProductionDeploymentContext, ProductionEndpointContext));
    });

});
