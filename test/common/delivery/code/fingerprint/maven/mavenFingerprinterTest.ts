import { MavenFingerprinter } from "../../../../../../src";
import * as assert from "power-assert";

describe("Maven fingerprinter", () => {

    const fingerprinter = new MavenFingerprinter();

    it("should have name", async () => {
        assert(!!fingerprinter.name);
    });

});
