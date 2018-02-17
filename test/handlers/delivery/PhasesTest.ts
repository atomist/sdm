import "mocha";
import * as assert from "power-assert";
import {parseContext} from "../../../src/handlers/events/delivery/Phases";
import {ScanContext} from "../../../src/handlers/events/delivery/phases/core";

describe("Phase handling", () => {
   it("parses my contexts", () => {
       const result = parseContext(ScanContext);
       assert.equal(result.name, "scan");
       assert.equal(result.context, ScanContext);
   });

});
