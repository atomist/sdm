
import * as assert from "power-assert";
import { firstAvailableProgressLog } from "../../../src/common/log/firstAvailableProgressLog";
import { ConsoleProgressLog } from "../../../src";

const NeverAvailableProgressLog = new ConsoleProgressLog("neverAvailable");
NeverAvailableProgressLog.isAvailable = async () => false;

const AvailableProgressLog = new ConsoleProgressLog("available");

describe("firstAvailable", () => {

    it("should fail with none available", async () => {
        try {
            await firstAvailableProgressLog(NeverAvailableProgressLog);
            assert.fail("Should've thrown an exception");
        } catch {
            // Ok
        }
    });

    it("should succeed with one available", async () => {
        const faLog = await firstAvailableProgressLog(AvailableProgressLog);
        assert.equal(faLog, AvailableProgressLog);
    });

    it("should succeed with one unavailable and one available", async () => {
        const faLog = await firstAvailableProgressLog(NeverAvailableProgressLog, AvailableProgressLog);
        assert.equal(faLog, AvailableProgressLog);
    });

    it("should succeed with one unavailable and two available, picking first available", async () => {
        const faLog = await firstAvailableProgressLog(NeverAvailableProgressLog, AvailableProgressLog, new ConsoleProgressLog("dontUseMe"));
        assert.equal(faLog, AvailableProgressLog);
    });

    it("should not ask availability after finding an available logger", async () => {
        const dontAskMe = new ConsoleProgressLog("dontAsk");
        dontAskMe.isAvailable = async () => { throw new Error("I said DON'T ASK")};
        const faLog = await firstAvailableProgressLog(AvailableProgressLog, dontAskMe);
        assert.equal(faLog, AvailableProgressLog);
    });

});
