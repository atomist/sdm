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

import * as assert from "power-assert";
import { firstAvailableProgressLog } from "../../../src/api-helper/log/firstAvailableProgressLog";
import { LoggingProgressLog } from "../../../src/api-helper/log/LoggingProgressLog";

const NeverAvailableProgressLog = new LoggingProgressLog("neverAvailable");
NeverAvailableProgressLog.isAvailable = async () => false;

const AvailableProgressLog = new LoggingProgressLog("available");

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
        const faLog = await firstAvailableProgressLog(NeverAvailableProgressLog, AvailableProgressLog, new LoggingProgressLog("dontUseMe"));
        assert.equal(faLog, AvailableProgressLog);
    });

    it("should not ask availability after finding an available logger", async () => {
        const dontAskMe = new LoggingProgressLog("dontAsk");
        dontAskMe.isAvailable = async () => {
            throw new Error("I said DON'T ASK");
        };
        const faLog = await firstAvailableProgressLog(AvailableProgressLog, dontAskMe);
        assert.equal(faLog, AvailableProgressLog);
    });

});
