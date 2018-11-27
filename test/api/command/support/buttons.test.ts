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

import * as assert from "assert";
import { actionableButton } from "../../../../lib/api/command/support/buttons";
import { CodeTransformRegistration } from "../../../../lib/api/registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../../../../lib/api/registration/CommandHandlerRegistration";

describe("actionableButton", () => {

    it("should handle undefined", () => {
        const button = actionableButton({ text: "Ok" }, { name: "someCommand" } as any as CodeTransformRegistration) as any;
        assert.deepStrictEqual(button.command.parameters, {});
        assert(button.command.name === "someCommand");
    });

    it("should handle simple property", () => {
        const button = actionableButton({ text: "Ok" }, { name: "someCommand" } as any as CommandHandlerRegistration, { name: "Fred" }) as any;
        assert.deepStrictEqual(button.command.parameters, { name: "Fred" });
    });

    it("should handle nested property", () => {
        const button = actionableButton({ text: "Ok" }, { name: "someCommand" } as any as CommandHandlerRegistration, {
            name: "Fred",
            address: { street: "somewhere" },
        }) as any;
        assert.deepStrictEqual(button.command.parameters, { "name": "Fred", "address.street": "somewhere" });
    });

    it("should handle nested nested property", () => {
        const button = actionableButton({ text: "Ok" }, { name: "someCommand" } as any as CommandHandlerRegistration, {
            name: "Fred",
            address: { street: "somewhere", zip: { code: "12345" } },
        }) as any;
        assert.deepStrictEqual(button.command.parameters, {
            "name": "Fred",
            "address.street": "somewhere",
            "address.zip.code": "12345",
        });
    });
});
