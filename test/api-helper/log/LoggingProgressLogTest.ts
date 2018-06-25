import { LoggingProgressLog } from "../../../src/api-helper/log/LoggingProgressLog";
import *  as assert from "assert";

describe("The logging progress logger", () => {

    it("remembers the log accurately", () => {
        const progressLog = new LoggingProgressLog("hi", "debug");
        const input = [`I am some stuff
that might get written to the log
and so on
`, "and so on and so on\n"];
        input.forEach(line => progressLog.write(line));

        assert.strictEqual(progressLog.log, input.join(""));
    });
});
