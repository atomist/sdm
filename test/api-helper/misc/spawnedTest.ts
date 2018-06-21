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
import { createEphemeralProgressLog } from "../../../src/api-helper/log/EphemeralProgressLog";
import { spawnAndWatch, SpawnCommand } from "../../../src/api-helper/misc/spawned";
import { fakeContext } from "../../../src/api-helper/test/fakeContext";
import { SdmGoal } from "../../../src/api/goal/SdmGoal";

describe("spawned", () => {

    it("should handle invalid command", async () => {
        const sc: SpawnCommand = {command: "thisIsNonsense"};
        try {
            await spawnAndWatch(sc, {},
                await createEphemeralProgressLog(fakeContext(), { name: "test"} as SdmGoal),
                {});
            assert.fail("Should have thrown an exception");
        } catch (err) {
            // Ok
        }
    });

    it("should handle valid command with no error finder", async () => {
        const sc: SpawnCommand = {command: "ls"};
        const r = await spawnAndWatch(sc, {},
            await createEphemeralProgressLog(fakeContext(), { name: "test"} as SdmGoal),
            {});
        assert.equal(r.error, false);
        assert.equal(r.error, false);
    });

    it("should use default on attempt to pass in undefined error finder", async () => {
        const sc: SpawnCommand = {command: "ls"};
        const r = await spawnAndWatch(sc, {},
            await createEphemeralProgressLog(fakeContext(), { name: "test"} as SdmGoal),
            {
                errorFinder: undefined,
            });
        assert.equal(r.error, false);
        assert.equal(r.error, false);
    });

    it("should handle valid command with error finder", async () => {
        const sc: SpawnCommand = {command: "ls"};
        const r = await spawnAndWatch(sc, {},
            await createEphemeralProgressLog(fakeContext(), { name: "test"} as SdmGoal),
            {
                errorFinder: () => false,
            });
        assert.equal(r.error, false);
        assert.equal(r.error, false);
    });

});
