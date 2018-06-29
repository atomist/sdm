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

import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

/**
 * Fluent builder for parameters
 */
export class ParametersBuilder {

    public readonly parameters: NamedParameter[] = [];
    public readonly mappedParameters: NamedMappedParameter[] = [];
    public readonly secrets: NamedSecret[] = [];

    /**
     * Declare a new parameter for a command
     * @param {NamedParameter} p
     * @return {this}
     */
    public addParameter(p: NamedParameter): this {
        this.parameters.push(p);
        return this;
    }

    /**
     * Declare a new mapped parameter for a command
     * @param {NamedMappedParameter} mp
     * @return {this}
     */
    public addMappedParameter(mp: NamedMappedParameter): this {
        this.mappedParameters.push(mp);
        return this;
    }

    /**
     * Declare a new secret for a command
     * @param {NamedSecret} s
     * @return {this}
     */
    public addSecret(s: NamedSecret): this {
        this.secrets.push(s);
        return this;
    }
}

export type NamedParameter = BaseParameter & { name: string };

export interface NamedSecret {
    name: string;
    uri: string;
}

export interface NamedMappedParameter {
    name: string;
    uri: string;
    required?: boolean;
}

/**
 * Declare a new parameter for the given command
 * @param {NamedParameter} p
 * @return {ParametersBuilder}
 */
export function addParameter(p: NamedParameter): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.parameters.push(p);
    return pb;
}

/**
 * Declare a new mapped parameter for the given command
 * @param {NamedMappedParameter} p
 * @return {ParametersBuilder}
 */
export function addMappedParameter(p: NamedMappedParameter): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.mappedParameters.push(p);
    return pb;
}

/**
 * Declare a new secret for the given command
 * @param {NamedSecret} s
 * @return {ParametersBuilder}
 */
export function addSecret(s: NamedSecret): ParametersBuilder {
    const pb = new ParametersBuilder();
    pb.secrets.push(s);
    return pb;
}
