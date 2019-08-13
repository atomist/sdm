/*
 * Copyright © 2019 Atomist, Inc.
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

import assert = require("power-assert");
import {
    createJob,
    JobTaskType,
} from "../../../../lib/api-helper/misc/job/createJob";
import { CommandHandlerRegistration } from "../../../../lib/api/registration/CommandHandlerRegistration";

describe("createJob", () => {

    it("should create job with one task and command name", async () => {
        const result = await createJob({
            command: "TestCommand",
            registration: "@atomist/sdm-test",
            description: "This is a test command",
            parameters: {
                foo: "bar",
            },
        }, {
            context: {
                name: "@atomist/sdm-test",
            },
            graphClient: {
                mutate: async options => {
                    const vars = options.variables;
                    assert.strictEqual(vars.name, "TestCommand");
                    assert.strictEqual(vars.description, "This is a test command");
                    assert.strictEqual(vars.owner, "@atomist/sdm-test");
                    assert.strictEqual(vars.tasks.length, 1);
                    assert.strictEqual(vars.tasks[0].name, "TestCommand");
                    assert.strictEqual(vars.tasks[0].data, JSON.stringify({
                        type: JobTaskType.Command,
                        parameters: { foo: "bar" },
                    }));

                    return {
                        createAtmJob: { id: "123456" },
                    } as any;
                },
            } as any,
        } as any);

        assert.deepStrictEqual(result, { id: "123456" });
    });

    it("should create job with one task and command registration", async () => {
        const result = await createJob({
            // tslint:disable-next-line:no-object-literal-type-assertion
            command: { name: "TestCommand" } as CommandHandlerRegistration,
            registration: "@atomist/sdm-test",
            description: "This is a test command",
            parameters: {
                foo: "bar",
            },
        }, {
            context: {
                name: "@atomist/sdm-test",
            },
            graphClient: {
                mutate: async options => {
                    const vars = options.variables;
                    assert.strictEqual(vars.name, "TestCommand");
                    assert.strictEqual(vars.description, "This is a test command");
                    assert.strictEqual(vars.owner, "@atomist/sdm-test");
                    assert.strictEqual(vars.tasks.length, 1);
                    assert.strictEqual(vars.tasks[0].name, "TestCommand");
                    assert.strictEqual(vars.tasks[0].data, JSON.stringify({
                        type: JobTaskType.Command,
                        parameters: { foo: "bar" },
                    }));

                    return {
                        createAtmJob: { id: "123456" },
                    } as any;
                },
            } as any,
        } as any);

        assert.deepStrictEqual(result, { id: "123456" });
    });

    it("should create job with several tasks", async () => {
        const result = await createJob({
            command: "TestCommand",
            registration: "@atomist/sdm-test",
            description: "This is a test command",
            parameters: [{
                color: "blue",
            }, {
                color: "red",
            }, {
                color: "green",
            }],
        }, {
            context: {
                name: "@atomist/sdm-test",
            },
            graphClient: {
                mutate: async options => {
                    const vars = options.variables;
                    assert.strictEqual(vars.name, "TestCommand");
                    assert.strictEqual(vars.description, "This is a test command");
                    assert.strictEqual(vars.owner, "@atomist/sdm-test");
                    assert.strictEqual(vars.tasks.length, 3);
                    assert.strictEqual(vars.tasks[0].name, "TestCommand");
                    assert.strictEqual(vars.tasks[0].data, JSON.stringify({
                        type: JobTaskType.Command,
                        parameters: { color: "blue" },
                    }));
                    assert.strictEqual(vars.tasks[1].name, "TestCommand");
                    assert.strictEqual(vars.tasks[1].data, JSON.stringify({
                        type: JobTaskType.Command,
                        parameters: { color: "red" },
                    }));
                    assert.strictEqual(vars.tasks[2].name, "TestCommand");
                    assert.strictEqual(vars.tasks[2].data, JSON.stringify({
                        type: JobTaskType.Command,
                        parameters: { color: "green" },
                    }));

                    return {
                        createAtmJob: { id: "123456" },
                    } as any;
                },
            } as any,
        } as any);

        assert.deepStrictEqual(result, { id: "123456" });
    });

    it("should reject invalid parameters", async () => {

        try {
            await createJob({
                    command: "TestCommand",
                    registration: "@atomist/sdm-test",
                    description: "This is a test command",
                    parameters: [],
                },
                undefined,
            );
            assert.fail();
        } catch (e) {
            assert(e.message === "Invalid parameters passed. Please pass at least one empty object!");
        }

    });

});
