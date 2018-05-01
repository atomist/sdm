/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import * as assert from "power-assert";
import {RolarProgressLog} from "../../../src/common/log/RolarProgressLog";

/*describe("RolarProgressLog", () => {

    function* fakeTimestampGenerator() {
        let index = 0;
        while (true) {
            yield new Date(index++);
        }
    }

    const mockAxios = new MockAdapter(axios);

    it("should be available if returning http 200", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });

        mockAxios.onHead("http://fakehost/api/logs").replyOnce(200);

        assert.equal(await log.isAvailable(), true);
    });

    it("should not be available if returning http 404", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });

        mockAxios.onHead("http://fakehost/api/logs").replyOnce(404);

        assert.equal(await log.isAvailable(), false);
    });

    it("should write logs to memory", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });

        log.write("I'm a lumberjack and I'm OK");
        log.write("I sleep all night and I work all day");

        assert.deepEqual((log as any).localLogs, [
            {
                level: "info",
                message: "I'm a lumberjack and I'm OK",
                timestamp: "01/01/1970 00:00:00.000",
            },
            {
                level: "info",
                message: "I sleep all night and I work all day",
                timestamp: "01/01/1970 00:00:00.001",
            },
        ]);
    });

    it("should flush logs", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });
        mockAxios.onPost("http://fakehost/api/logs/test")
            .replyOnce(config => {
            const expectedRequest = [
                {
                    level: "info",
                    message: "He's a lumberjack and he's OK",
                    timestamp: "01/01/1970 00:00:00.000",
                },
                {
                    level: "info",
                    message: "He sleeps all night and he works all day",
                    timestamp: "01/01/1970 00:00:00.001",
                },
            ];
            const actualRequest = JSON.parse(config.data).content;
            assert.deepEqual(actualRequest, expectedRequest);
            return [200];
        });

        log.write("He's a lumberjack and he's OK");
        log.write("He sleeps all night and he works all day");
        await log.flush();

        assert.deepEqual((log as any).localLogs, []);
    });

    it("should not clear logs if flush fails", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });
        mockAxios.onPost("http://fakehost/api/logs/test")
            .replyOnce(404);

        log.write("I cut down trees, I eat my lunch");
        log.write("I go to the lavatory");
        await log.flush();

        assert.deepEqual((log as any).localLogs, [
            {
                level: "info",
                message: "I cut down trees, I eat my lunch",
                timestamp: "01/01/1970 00:00:00.000",
            },
            {
                level: "info",
                message: "I go to the lavatory",
                timestamp: "01/01/1970 00:00:00.001",
            },
        ]);
    });

    it("should close logs", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, fakeTimestampGenerator(), { retries: 0 });
        mockAxios.onPost("http://fakehost/api/logs/test?closed=true")
            .replyOnce(config => {
                const expectedRequest = [
                    {
                        level: "info",
                        message: "On Wednesdays I go shopping and have buttered scones for tea",
                        timestamp: "01/01/1970 00:00:00.000",
                    },
                ];
                const actualRequest = JSON.parse(config.data).content;
                assert.deepEqual(actualRequest, expectedRequest);
                return [200];
            });

        log.write("On Wednesdays I go shopping and have buttered scones for tea");
        await log.close();

        assert.deepEqual((log as any).localLogs, []);
    });

    it("should flush logs automatically", async () => {
        const smallBufferLog = new RolarProgressLog("http://fakehost", ["test"], 50, fakeTimestampGenerator(), { retries: 0 });
        mockAxios.onPost("http://fakehost/api/logs/test")
            .replyOnce(config => {
                const expectedRequest = [
                    {
                        level: "info",
                        message: "He cuts down trees, he eat his lunch",
                        timestamp: "01/01/1970 00:00:00.000",
                    },
                    {
                        level: "info",
                        message: "He goes to the lavatory",
                        timestamp: "01/01/1970 00:00:00.001",
                    },
                ];
                const actualRequest = JSON.parse(config.data).content;
                assert.deepEqual(actualRequest, expectedRequest);
                return [200];
            });

        smallBufferLog.write("He cuts down trees, he eat his lunch");
        smallBufferLog.write("He goes to the lavatory");
        smallBufferLog.write("On Wednesdays he goes shopping and has buttered scones for tea");

        assert.deepEqual((smallBufferLog as any).localLogs, []);
    });

}); */
