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

import { SelfDescribingHandleCommand } from "@atomist/automation-client/HandleCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { toFactory } from "@atomist/automation-client/util/constructionUtils";
import * as assert from "power-assert";
import {
    commandHandlerRegistrationToCommand,
    editorRegistrationToCommand,
    generatorRegistrationToCommand,
} from "../../../src/api-helper/machine/handlerRegistrations";
import { SeedDrivenGeneratorParametersSupport } from "../../../src/api/command/generator/SeedDrivenGeneratorParametersSupport";
import { CommandHandlerRegistration } from "../../../src/api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../../src/api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../../src/api/registration/GeneratorRegistration";
import { addParameters } from "../../../src/api/registration/ParametersBuilder";
import { DeclarationType, ParametersObject } from "../../../src/api/registration/ParametersDefinition";

describe("command registrations", () => {

    it("parameter builder should set parameters", () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            parameters:
                addParameters({name: "foo"},
                    {name: "bar", required: true}),
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        const bar = instance.parameters.find(p => p.name === "bar");
        assert(bar.required);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set parameters via indexed property", () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            parameters:
                {
                    foo: {},
                    bar: {required: true},
                },
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        const bar = instance.parameters.find(p => p.name === "bar");
        assert(bar.required);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set mapped parameters", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            parameters:
                addParameters({name: "foo"},
                    {name: "bar", required: true})
                    .addMappedParameters({name: "x", uri: "http://thing"}),
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        assert.equal(instance.mapped_parameters.length, 1);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set secret", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            parameters:
                addParameters({name: "foo"})
                    .addParameters({name: "bar", required: true})
                    .addSecrets({name: "x", uri: "http://thing"}),
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        assert.equal(instance.secrets.length, 1);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set mapped parameter and secret via indexed property", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            parameters:
                {
                    foo: {},
                    bar: {required: true},
                    x: {type: DeclarationType.secret, uri: "http://thing1"},
                    y: {type: DeclarationType.mapped, uri: "http://thing2", required: false},
                },
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        const bar = instance.parameters.find(p => p.name === "bar");
        assert(bar.required);
        assert.equal(instance.secrets.length, 1);
        const x = instance.secrets.find(p => p.name === "x");
        assert.equal(x.uri, "http://thing1");
        assert.equal(instance.mapped_parameters.length, 1);
        const y = instance.mapped_parameters.find(p => p.name === "y");
        assert.equal(y.uri, "http://thing2");
        assert(!y.required);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set mapped parameter and secret via indexed property, with spread", () => {
        const halfOfParameters: ParametersObject = {
            bar: {required: true},
            x1: {type: DeclarationType.secret, uri: "http://thing1"},
            y1: {type: DeclarationType.mapped, uri: "http://thing2", required: false},

        };
        const reg: CommandHandlerRegistration = {
            name: "test",
            parameters:
                {
                    foo: {},
                    x2: {type: DeclarationType.secret, uri: "http://thing1"},
                    y2: {type: DeclarationType.mapped, uri: "http://thing2", required: false},
                    ...halfOfParameters,
                },
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        const bar = instance.parameters.find(p => p.name === "bar");
        assert(bar.required);
        assert.equal(instance.secrets.length, 2);
        const x1 = instance.secrets.find(p => p.name === "x1");
        assert.equal(x1.uri, "http://thing1");
        assert.equal(instance.mapped_parameters.length, 2);
        const y1 = instance.mapped_parameters.find(p => p.name === "y1");
        assert.equal(y1.uri, "http://thing2");
        assert(!y1.required);
        const x2 = instance.secrets.find(p => p.name === "x2");
        assert.equal(x2.uri, "http://thing1");
        const y2 = instance.mapped_parameters.find(p => p.name === "y2");
        assert.equal(y2.uri, "http://thing2");
        assert(!y2.required);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("should combine builder and maker", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({seed: () => new GitHubRepoRef("a", "b")}),
            parameters:
                addParameters({name: "foo"})
                    .addParameters({name: "bar", required: true}),
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "target.repo"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("should build on generator", () => {
        const reg: GeneratorRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({seed: () => new GitHubRepoRef("a", "b")}),
            parameters:
                addParameters({name: "foo"})
                    .addParameters({name: "bar", required: true}),
            editor: async p => p,
        };
        const maker = generatorRegistrationToCommand({
            artifactStore: null,
            name: "test",
            repoRefResolver: null,
            projectLoader: null,
            logFactory: null,
            repoFinder: null,
            projectPersister: null,
            credentialsResolver: null,
        }, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "target.repo"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("should build on generator", () => {
        const reg: EditorRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({seed: () => new GitHubRepoRef("a", "b")}),
            parameters:
                addParameters({name: "foo"})
                    .addParameters({name: "bar", required: true}),
            editor: async p => p,
        };
        const maker = editorRegistrationToCommand({
            artifactStore: null,
            name: "test",
            repoRefResolver: null,
            projectLoader: null,
            logFactory: null,
            repoFinder: null,
            projectPersister: null,
            credentialsResolver: null,
        }, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        // From common
        assert(instance.parameters.some(p => p.name === "targets.repos"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

});
