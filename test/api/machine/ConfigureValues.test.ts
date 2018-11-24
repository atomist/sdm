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
import {
    ConfigurationValueType,
    validateConfigurationValues,
} from "../../../lib/api/machine/ConfigurationValues";

describe("validateConfigurationValues", () => {

    it("should validate no missing values", done => {
        const config = {};
        const requiredValues = [];
        validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        done();
    });

    it("should validate simple missing value", done => {
        const config = {};
        const requiredValues = ["sdm.test"];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Missing configuration values. Please add the following values to your client configuration: 'sdm.test'");
        }
        done();
    });

    it("should validate simple missing value with type", done => {
        const config = {};
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.String }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Missing configuration values. Please add the following values to your client configuration: 'sdm.test'");
        }
        done();
    });

    it("should validate simple value with wrong type", done => {
        const config = { sdm: { test: true } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.String }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Invalid configuration values. The following values have the wrong type: 'sdm.test true is not a 'string''");
        }
        done();
    });

    it("should validate value with wrong string type", done => {
        const config = { sdm: { test: true } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.String }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Invalid configuration values. The following values have the wrong type: 'sdm.test true is not a 'string''");
        }
        done();
    });

    it("should validate value with wrong boolean type", done => {
        const config = { sdm: { test: "foo" } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.Boolean }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Invalid configuration values. The following values have the wrong type: 'sdm.test \"foo\" is not a 'boolean''");
        }
        done();
    });

    it("should validate value with wrong number type", done => {
        const config = { sdm: { test: "foo" } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.Number }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Invalid configuration values. The following values have the wrong type: 'sdm.test \"foo\" is not a 'number''");
        }
        done();
    });

    it("should validate value with correct type", done => {
        const config = { sdm: { test: "bla" } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.String }];
        validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        done();
    });

    it("should validate values with wrong type", done => {
        const config = {
            sdm:
                {
                    test1: true,
                    test2: "bar",
                    test3: "foo",
                },
        };
        const requiredValues = [
            { path: "sdm.test1", type: ConfigurationValueType.String },
            { path: "sdm.test2", type: ConfigurationValueType.Boolean },
            { path: "sdm.test3", type: ConfigurationValueType.Number },
        ];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.equal(err.message,
                "Invalid configuration values. The following values have the wrong type: 'sdm.test1 true is not a 'string', " +
                "sdm.test2 \"bar\" is not a 'boolean', sdm.test3 \"foo\" is not a 'number''");
        }
        done();
    });

    it("should validate value with correct number type", done => {
        const config = { sdm: { test: 3 } };
        const requiredValues = [{ path: "sdm.test", type: ConfigurationValueType.Number }];
        try {
            validateConfigurationValues(config, { requiredConfigurationValues: requiredValues });
        } catch (err) {
            assert.fail();
        }
        done();
    });
});
