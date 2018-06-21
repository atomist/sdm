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

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import * as assert from "power-assert";
import {RolarProgressLog} from "../../src/log/RolarProgressLog";

describe("RolarProgressLog", () => {

    function* fakeTimestampGenerator() {
        let index = 0;
        while (true) {
            yield new Date(index++);
        }
    }

    it("should be available if returning http 200", async () => {
        const axiosInstance = axios.create();
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator(), { retries: 0 },
            axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
        mockAxios.onHead("http://fakehost/api/logs").replyOnce(200);

        assert.equal(await log.isAvailable(), true);
    });

    it("should not be available if returning http 404", async () => {
        const axiosInstance = axios.create();
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator(), { retries: 0 },
            axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
        mockAxios.onHead("http://fakehost/api/logs").replyOnce(404);

        assert.equal(await log.isAvailable(), false);
    });

    it("should write logs to memory", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator());

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
        const axiosInstance = axios.create();
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator(), { retries: 0 },
            axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
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
        const axiosInstance = axios.create();
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator(), { retries: 0 },
            axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
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
        const axiosInstance = axios.create();
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "info", fakeTimestampGenerator(), { retries: 0 },
            axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
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
        const axiosInstance = axios.create();
        const smallBufferLog = new RolarProgressLog("http://fakehost", ["test"], 50, "info", fakeTimestampGenerator(),
            { retries: 0 }, axiosInstance);
        const mockAxios = new MockAdapter(axiosInstance);
        mockAxios.onPost("http://fakehost/api/logs/test")
            .replyOnce(config => {
                const expectedRequest = [
                    {
                        level: "info",
                        message: "He cuts down trees, he eats his lunch",
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

        smallBufferLog.write("He cuts down trees, he eats his lunch");
        smallBufferLog.write("He goes to the lavatory");
        smallBufferLog.write("On Wednesdays he goes shopping and has buttered scones for tea");

        assert.deepEqual((smallBufferLog as any).localLogs, []);
    });

    it("should provide a link to the log", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test", "it"], 10000, "info", fakeTimestampGenerator());

        assert.equal(log.url, "http://fakehost/logs/test/it");
    });

    it("should log as debug", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "debug", fakeTimestampGenerator());

        log.write("I'm a lumberjack and I'm OK");
        log.write("I sleep all night and I work all day");

        assert.deepEqual((log as any).localLogs, [
            {
                level: "debug",
                message: "I'm a lumberjack and I'm OK",
                timestamp: "01/01/1970 00:00:00.000",
            },
            {
                level: "debug",
                message: "I sleep all night and I work all day",
                timestamp: "01/01/1970 00:00:00.001",
            },
        ]);
    });

    it("should log without timestamp", async () => {
        const log = new RolarProgressLog("http://fakehost", ["test"], 10000, "", null);

        log.write("I'm a lumberjack and I'm OK");
        log.write("I sleep all night and I work all day");

        assert.deepEqual((log as any).localLogs, [
            {
                level: "",
                message: "I'm a lumberjack and I'm OK",
                timestamp: "",
            },
            {
                level: "",
                message: "I sleep all night and I work all day",
                timestamp: "",
            },
        ]);
    });

});
