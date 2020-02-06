/*
 * Copyright © 2020 Atomist, Inc.
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

import * as assert from "assert";
import { createSkillContext } from "../../../lib/api/context/skillContext";

describe("skillContext", () => {

    describe("createSkillContext", () => {

        it("should handle no skill configuration", () => {
            assert.deepStrictEqual(createSkillContext({} as any), {});
        });

        it("should correctly extract single parameter", () => {
            const ctx = {
                trigger: {
                    configuration: {
                        name: "default",
                        parameters: [{ name: "foo", value: "bar" }],
                    },
                },
            } as any;
            assert.deepStrictEqual(createSkillContext(ctx), {
                configuration: {
                    name: "default",
                    parameters: { foo: "bar" },
                },
            });
        });

        it("should correctly extract multiple parameters", () => {
            const ctx = {
                trigger: {
                    configuration: {
                        name: "default",
                        parameters: [
                            { name: "foo", value: "bar" },
                            { name: "number", value: 10 },
                            { name: "bool", value: false },
                        ],
                    },
                },
            } as any;
            assert.deepStrictEqual(createSkillContext(ctx), {
                configuration: {
                    name: "default",
                    parameters: {
                        foo: "bar",
                        number: 10,
                        bool: false,
                    },
                },
            });
        });

    });

});
