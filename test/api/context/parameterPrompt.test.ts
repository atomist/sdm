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

import { WebSocketLifecycle } from "@atomist/automation-client/lib/internal/transport/websocket/WebSocketLifecycle";
import * as assert from "assert";
import { CommandListenerExecutionInterruptError } from "../../../lib/api-helper/machine/handlerRegistrations";
import { commandRequestParameterPromptFactory } from "../../../lib/api/context/parameterPrompt";

describe("parameterPrompt", () => {

    describe("commandRequestParameterPromptFactory", () => {

        after(() => {
            delete (global as any).__runningAutomationClient;
        });

        it("should correctly find already existing parameters", async () => {
            const ctx = {
                trigger: {
                    parameters: [
                        { name: "foo", value: "bar" },
                        { name: "some", value: "other" },
                    ],
                },
            };

            const params = await commandRequestParameterPromptFactory(ctx as any)({ foo: { required: true } }) as any;
            assert.strictEqual(params.foo, ctx.trigger.parameters[0].value);
        });

        it("should ask for missing parameters", async () => {
            const wsMock: WebSocketLifecycle = {
                send: msg => {
                    assert(msg.parameter_specs.length === 2);
                    assert.strictEqual(msg.parameter_specs[0].name, "bar");
                    assert.strictEqual(msg.parameter_specs[1].name, "test");
                },
            } as any;

            (global as any).__runningAutomationClient = {
                configuration: {
                    ws: {
                        lifecycle: wsMock,
                    },
                },
            };

            const ctx = {
                trigger: {
                    parameters: [
                        { name: "foo", value: "bar" },
                        { name: "some", value: "other" },
                    ],
                },
            };

            try {
                const params = await commandRequestParameterPromptFactory(ctx as any)({
                    bar: { required: true },
                    test: { required: true },
                    foo: { required: true },
                }) as any;
                assert.fail();
                assert.strictEqual(params, {});
            } catch (e) {
                assert(e instanceof CommandListenerExecutionInterruptError);
            }
        });

        it("should not ask for missing optional parameters if there no required missing", async () => {
            const wsMock: WebSocketLifecycle = {
                send: msg => {
                    assert.fail();
                },
            } as any;

            (global as any).__runningAutomationClient = {
                configuration: {
                    ws: {
                        lifecycle: wsMock,
                    },
                },
            };

            const ctx = {
                trigger: {
                    parameters: [
                        { name: "some", value: "other" },
                    ],
                },
            };

            const params = await commandRequestParameterPromptFactory(ctx as any)({
                test: { required: false },
                foo: { required: false },
            }) as any;
            assert.deepStrictEqual(params, {});
        });

        it("should ask for missing optional parameters only when there's at least one required", async () => {
            const wsMock: WebSocketLifecycle = {
                send: msg => {
                    assert(msg.parameter_specs.length === 3);
                    assert.strictEqual(msg.parameter_specs[0].name, "bar");
                    assert.strictEqual(msg.parameter_specs[1].name, "test");
                    assert.strictEqual(msg.parameter_specs[2].name, "foo");
                },
            } as any;

            (global as any).__runningAutomationClient = {
                configuration: {
                    ws: {
                        lifecycle: wsMock,
                    },
                },
            };

            const ctx = {
                trigger: {
                    parameters: [
                        { name: "some", value: "other" },
                        { name: "superfoo", value: "other" }
                    ],
                },
            };

            try {
                const params = await commandRequestParameterPromptFactory(ctx as any)({
                    bar: { required: true },
                    test: { required: true },
                    foo: { required: true },
                    superfoo: { required: true },
                }) as any;
                assert.fail();
                assert.strictEqual(params, {});
            } catch (e) {
                assert(e instanceof CommandListenerExecutionInterruptError);
            }
        });


    });

});
