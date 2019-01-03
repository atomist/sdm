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

import * as os from "os";
import * as assert from "power-assert";
import { createEphemeralProgressLog } from "../../../lib/api-helper/log/EphemeralProgressLog";
import {
    killAndWait,
    spawn,
    spawnAndLog,
    spawnLog,
} from "../../../lib/api-helper/misc/child_process";
import { fakeContext } from "../../../lib/api-helper/testsupport/fakeContext";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";

describe("child_process", () => {

    describe("spawnLog", () => {

        it("should handle invalid command", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            try {
                await spawnLog("thisIsNonsense", [], { log });
                assert.fail("Should have thrown an exception");
            } catch (err) {
                assert(err.message.startsWith("Failed to run command: "));
            }
        });

        it("should recognize successful exit with default error finder", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                log,
                timeout: 1000,
            };
            const script = "process.exit(0);";
            const r = await spawnLog("node", ["-e", script], opts);
            assert(r.status === 0);
            assert(r.code === 0);
            assert(r.error === null);
        });

        it("should use default error finder if undefined provided", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                errorFinder: undefined,
                log,
                timeout: 1000,
            };
            const script = "process.exit(1);";
            const r = await spawnLog("node", ["-e", script], opts);
            assert(r.status === 1);
            assert(r.code === 1);
            assert(r.error);
            assert(r.error.message.startsWith("Error finder found error in results from "));
        });

        it("should use custom error finder", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                errorFinder: () => true,
                log,
                timeout: 1000,
            };
            const script = "process.exit(0);";
            const r = await spawnLog("node", ["-e", script], opts);
            assert(r.status === 0);
            assert(r.code === 99);
            assert(r.error);
            assert(r.error.message.startsWith("Error finder found error in results from "));
        });

    });

    describe("spawnAndLog", () => {

        /* tslint:disable:deprecation */

        it("should handle invalid command", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            try {
                await spawnAndLog(log, "thisIsNonsense");
                assert.fail("Should have thrown an exception");
            } catch (err) {
                assert(err.message.startsWith("Failed to run command: "));
            }
        });

        it("should recognize successful exit with default error finder", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                timeout: 1000,
            };
            const script = "process.exit(0);";
            const r = await spawnAndLog(log, "node", ["-e", script], opts);
            assert(r.status === 0);
            assert(r.code === 0);
            assert(r.error === null);
        });

        it("should use default error finder if undefined provided", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                errorFinder: undefined,
                timeout: 1000,
            };
            const script = "process.exit(1);";
            const r = await spawnAndLog(log, "node", ["-e", script], opts);
            assert(r.status === 1);
            assert(r.code === 1);
            assert(r.error);
            assert(r.error.message.startsWith("Error finder found error in results from "));
        });

        it("should use custom error finder", async () => {
            const log = await createEphemeralProgressLog(fakeContext(), { name: "test" } as SdmGoalEvent);
            const opts = {
                errorFinder: () => true,
                timeout: 1000,
            };
            const script = "process.exit(0);";
            const r = await spawnAndLog(log, "node", ["-e", script], opts);
            assert(r.status === 0);
            assert(r.code === 99);
            assert(r.error);
            assert(r.error.message.startsWith("Error finder found error in results from "));
        });

        /* tslint:enable:deprecation */

    });

    describe("killAndWait", () => {

        it("should kill and wait", async () => {
            const script = "let t = setTimeout(function() { process.exit(0) }, 5000)";
            let closed = false;
            let exited = false;
            const cp = spawn("node", ["-e", script]);
            cp.on("exit", (code, signal) => {
                exited = true;
            });
            cp.on("close", (code, signal) => {
                assert(code === null);
                assert(signal === "SIGTERM");
                closed = true;
            });
            cp.on("error", err => {
                assert.fail(`child process ${cp.pid} errored: ${err.message}`);
            });
            await killAndWait(cp, 2000);
            assert(exited, `child process ${cp.pid} should have exited`);
            assert(closed, `child process ${cp.pid} should have closed`);
        });

        it("should fall through to SIGKILL", async function() {
            if (os.platform() === "win32") {
                /* tslint:disable-next-line:no-invalid-this */
                this.skip();
            }
            // delay to allow the spawned node process to start and set up signal handler
            const delay = 100;
            function sleep(ms: number): Promise<void> {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            const script = "process.on('SIGTERM', function() { return; }); let t = setTimeout(function() { process.exit(7) }, 7000)";
            let closed = false;
            let exited = false;
            const cp = spawn("node", ["-e", script]);
            cp.on("exit", (code, signal) => {
                exited = true;
            });
            cp.on("close", (code, signal) => {
                assert(code === null);
                assert(signal === "SIGKILL");
                closed = true;
            });
            cp.on("error", err => {
                assert.fail(`child process ${cp.pid} errored: ${err.message}`);
            });
            await sleep(delay);
            await killAndWait(cp, 2 * delay);
            assert(exited, `child process ${cp.pid} should have exited`);
            assert(closed, `child process ${cp.pid} should have closed`);
        });

    });

});
