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

import * as _ from "lodash";

/**
 * Describe the type of configuration value
 */
export enum ConfigurationValueType {
    Number,
    String,
    Boolean,
}

/**
 * Options that are used during configuration of an SDM but don't get passed on to the
 * running SDM instance
 */
export interface ConfigurationValues {

    /**
     * Optional array of required configuration value paths resolved against the root configuration
     */
    requiredConfigurationValues?: Array<string | { path: string, type: ConfigurationValueType }>;
}

/**
 * Validate the provided configuration
 * @param config
 * @param options
 */
export function validateConfigurationValues(config: any, options: ConfigurationValues): void {
    const missingValues = [];
    const invalidValues = [];
    (options.requiredConfigurationValues || []).forEach(v => {
        const path = typeof v === "string" ? v : v.path;
        const type = typeof v === "string" ? ConfigurationValueType.String : v.type;
        const value = _.get(config, path);
        if (!value) {
            missingValues.push(path);
        } else {
            switch (type) {
                case ConfigurationValueType.Number:
                    if (typeof value !== "number") {
                        invalidValues.push(`${path} ${JSON.stringify(value)} is not a 'number'`);
                    }
                    break;
                case ConfigurationValueType.String:
                    if (typeof value !== "string") {
                        invalidValues.push(`${path} ${JSON.stringify(value)} is not a 'string'`);
                    }
                    break;
                case ConfigurationValueType.Boolean:
                    if (typeof value !== "boolean") {
                        invalidValues.push(`${path} ${JSON.stringify(value)} is not a 'boolean'`);
                    }
                    break;
            }
        }
    });
    const errors = [];
    if (missingValues.length > 0) {
        errors.push(`Missing configuration values. Please add the following values to your client configuration: '${
            missingValues.join(", ")}'`);
    }
    if (invalidValues.length > 0) {
        errors.push(`Invalid configuration values. The following values have the wrong type: '${
            invalidValues.join(", ")}'`);
    }
    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
}
