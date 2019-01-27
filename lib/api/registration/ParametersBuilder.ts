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

import {
    NamedMappedParameter,
    NamedParameter,
    NamedSecret,
    NamedValue,
    ParametersListing,
} from "./ParametersDefinition";

/**
 * Fluent builder for command parameters. Similar to inquirer.js API.
 */
export class ParametersBuilder implements ParametersListing {

    public parameters: NamedParameter[] = [];
    public mappedParameters: NamedMappedParameter[] = [];
    public secrets: NamedSecret[] = [];
    public values: NamedValue[] = [];

    /**
     * Declare a new parameter for a command
     * @return {this}
     */
    public addParameters(p: NamedParameter, ...more: NamedParameter[]): this {
        this.parameters.push(p);
        this.parameters = this.parameters.concat(more);
        return this;
    }

    /**
     * Declare a new mapped parameter for a command
     * @return {this}
     */
    public addMappedParameters(mp: NamedMappedParameter, ...more: NamedMappedParameter[]): this {
        this.mappedParameters.push(mp);
        this.mappedParameters = this.mappedParameters.concat(more);
        return this;
    }

    /**
     * Declare a new secret for a command
     * @return {this}
     */
    public addSecrets(s: NamedSecret, ...more: NamedSecret[]): this {
        this.secrets.push(s);
        this.secrets = this.secrets.concat(more);
        return this;
    }

    /**
     * Declare a new value for a command
     * @return {this}
     */
    public addValues(s: NamedValue, ...more: NamedValue[]): this {
        this.values.push(s);
        this.values = this.values.concat(more);
        return this;
    }
}

/**
 * Declare a new parameter for the given command
 * @return {ParametersBuilder}
 */
export function addParameters(p: NamedParameter, ...more: NamedParameter[]): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.addParameters(p, ...more);
    return pb;
}

/**
 * Declare a new mapped parameter for the given command
 * @return {ParametersBuilder}
 */
export function addMappedParameters(p: NamedMappedParameter, ...more: NamedMappedParameter[]): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.addMappedParameters(p, ...more);
    return pb;
}

/**
 * Declare a new secret for the given command
 * @return {ParametersBuilder}
 */
export function addSecrets(s: NamedSecret, ...more: NamedSecret[]): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.addSecrets(s, ...more);
    return pb;
}

/**
 * Declare a new secret for the given command
 * @return {ParametersBuilder}
 */
export function addValues(s: NamedValue, ...more: NamedValue[]): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.addValues(s, ...more);
    return pb;
}
