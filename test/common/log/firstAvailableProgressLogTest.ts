import * as assert from "power-assert";
import { DebugProgressLog } from "../../../src";
import { firstAvailableProgressLog } from "../../../src/common/log/firstAvailableProgressLog";

const NeverAvailableProgressLog = new DebugProgressLog("neverAvailable");
NeverAvailableProgressLog.isAvailable = async () => false;

const AvailableProgressLog = new DebugProgressLog("available");

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
        const faLog = await firstAvailableProgressLog(NeverAvailableProgressLog, AvailableProgressLog, new DebugProgressLog("dontUseMe"));
        assert.equal(faLog, AvailableProgressLog);
    });

    it("should not ask availability after finding an available logger", async () => {
        const dontAskMe = new DebugProgressLog("dontAsk");
        dontAskMe.isAvailable = async () => {
            throw new Error("I said DON'T ASK");
        };
        const faLog = await firstAvailableProgressLog(AvailableProgressLog, dontAskMe);
        assert.equal(faLog, AvailableProgressLog);
    });

});
