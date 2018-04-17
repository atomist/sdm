import * as assert from "power-assert";
import { MavenFingerprinter } from "../../../../../../src";

describe("Maven fingerprinter", () => {

    const fingerprinter = new MavenFingerprinter();

    it("should have name", async () => {
        assert(!!fingerprinter.name);
    });

});
