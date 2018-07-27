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

import { Configuration } from "@atomist/automation-client";
import { fail } from "power-assert";
import * as assert from "power-assert";
import { validateRequiredConfigurationValues } from "../../../src/api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../src/api/machine/ExtensionPack";

describe("extensionPack", () => {

    describe("validateRequiredConfigurationValues", () => {

        it("should validate missing values",  done => {
            try {
                validateRequiredConfigurationValues(
                    {
                        sdm: {
                            foo: {
                                bar: "bla",
                            },
                        },
                    } as any as Configuration,
                    {
                        requiredConfigurationValues: [ "sdm.foo.bar", "sdm.bar.foo" ],
                    } as any as ExtensionPack);
                fail();
            } catch (err) {
                assert.equal(err.message,
                    "Missing configuration values. Please add the following values to your client configuration: 'sdm.bar.foo'");
                done();
            }
        });

    });

});
