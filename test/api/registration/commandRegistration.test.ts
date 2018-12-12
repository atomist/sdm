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

import {
    GitHubRepoRef,
    InMemoryProject,
    InMemoryProjectFile,
    Parameter,
    Parameters,
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client";
import { SelfDescribingHandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import { toFactory } from "@atomist/automation-client/lib/util/constructionUtils";
import * as assert from "power-assert";
import { isSeedDrivenGeneratorParameters } from "../../../lib/api-helper/command/generator/generatorCommand";
import {
    codeTransformRegistrationToCommand,
    commandHandlerRegistrationToCommand,
    generatorRegistrationToCommand,
} from "../../../lib/api-helper/machine/handlerRegistrations";
import { SeedDrivenGeneratorParametersSupport } from "../../../lib/api/command/generator/SeedDrivenGeneratorParametersSupport";
import { CodeTransformRegistration } from "../../../lib/api/registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../../../lib/api/registration/CommandHandlerRegistration";
import { GeneratorRegistration } from "../../../lib/api/registration/GeneratorRegistration";
import { addParameters } from "../../../lib/api/registration/ParametersBuilder";
import {
    DeclarationType,
    ParametersObject,
} from "../../../lib/api/registration/ParametersDefinition";
import { TestSoftwareDeliveryMachine } from "../../api-helper/TestSoftwareDeliveryMachine";

describe("command registrations", () => {

    it("parameter builder should set parameters", () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            parameters:
                addParameters({ name: "foo" },
                    { name: "bar", required: true }),
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
                bar: { required: true },
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

    it("parameter builder should set default value of parameters", () => {
        interface FooBar {
            foo?: string;
            bar: string;
        }
        const reg: CommandHandlerRegistration<FooBar> = {
            name: "test",
            parameters:
            {
                foo: {},
                bar: { required: true, defaultValue: "carrot" },
            },
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const commandInstance = toFactory(maker)() as SelfDescribingHandleCommand<FooBar>;
        assert.equal(commandInstance.parameters.length, 2);
        const bar = commandInstance.parameters.find(p => p.name === "bar");
        assert(bar.required);
        const pi = commandInstance.freshParametersInstance();
        assert.equal(pi.bar, "carrot");
    });

    it("parameter builder should set mapped parameters", () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            parameters:
                addParameters({ name: "foo" },
                    { name: "bar", required: true })
                    .addMappedParameters({ name: "x", uri: "http://thing" }),
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
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            parameters:
                addParameters({ name: "foo" })
                    .addParameters({ name: "bar", required: true })
                    .addSecrets({ name: "x", uri: "http://thing" }),
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
        const reg: CommandHandlerRegistration<any> = {
            name: "test",
            parameters:
            {
                foo: {},
                bar: { required: true },
                x: { declarationType: DeclarationType.secret, uri: "http://thing1" },
                y: { declarationType: DeclarationType.mapped, uri: "http://thing2", required: false },
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
            bar: { required: true },
            x1: { declarationType: DeclarationType.secret, uri: "http://thing1" },
            y1: { declarationType: DeclarationType.mapped, uri: "http://thing2", required: false },

        };
        const reg: CommandHandlerRegistration<any> = {
            name: "test",
            parameters:
            {
                foo: {},
                x2: { declarationType: DeclarationType.secret, uri: "http://thing1" },
                y2: { declarationType: DeclarationType.mapped, uri: "http://thing2", required: false },
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
        const reg: CommandHandlerRegistration<any> = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({ seed: () => new GitHubRepoRef("a", "b") }),
            parameters:
                addParameters({ name: "foo" })
                    .addParameters({ name: "bar", required: true }),
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

    it("should build on code transform", () => {
        const reg: CodeTransformRegistration = {
            name: "test",
            parameters:
                addParameters({ name: "foo" })
                    .addParameters({ name: "bar", required: true }),
            transform: async p => p,
        };
        const maker = codeTransformRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "targets.repos"));
        assert(instance.parameters.some(p => p.name === "dry-run"));
        assert(instance.parameters.some(p => p.name === "dry-run.msgId"));
        const pi = instance.freshParametersInstance();
        assert(!!pi);
    });

    it("should build on generator", () => {
        const reg: GeneratorRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({ seed: () => new GitHubRepoRef("a", "b") }),
            parameters:
                addParameters({ name: "foo" })
                    .addParameters({ name: "bar", required: true }),
            transform: async p => p,
        };
        const maker = generatorRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "target.repo"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("should build on generator using default parameters", () => {
        interface FooBar {
            foo?: string;
            bar: string;
        }
        const reg: GeneratorRegistration<FooBar> = {
            name: "test",
            startingPoint: new GitHubRepoRef("a", "b"),
            parameters:
            {
                foo: {},
                bar: { required: true, defaultValue: "carrot" },
            },
            transform: async p => p,
        };
        const maker = generatorRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand<FooBar>;
        const paramsInstance = instance.freshParametersInstance();
        assert(isSeedDrivenGeneratorParameters(paramsInstance),
            "Should have mixed in SeedDrivenGeneratorParameters: had " + JSON.stringify(paramsInstance));
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "target.repo"));
        assert(!instance.mapped_parameters.some(p => p.name === "screenName"), "screenName parameter should not appear by magic");
        const pi = instance.freshParametersInstance() as FooBar & SeedDrivenGeneratorParameters;
        assert.equal(pi.bar, "carrot");
        assert.equal(pi.addAtomistWebhook, false);
    });

    it("should build on generator using own parameters maker", () => {

        @Parameters()
        class FooParams {
            @Parameter()
            public something: string;
        }

        const reg: GeneratorRegistration = {
            name: "test",
            paramsMaker: FooParams,
            startingPoint: new GitHubRepoRef("a", "b"),
            parameters:
            {
                foo: {},
                bar: { required: true, defaultValue: "carrot" },
            },
            transform: async p => p,
        };
        const maker = generatorRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        const paramsInstance = instance.freshParametersInstance();
        assert(isSeedDrivenGeneratorParameters(paramsInstance),
            "Should have mixed in SeedDrivenGeneratorParameters: had " + JSON.stringify(paramsInstance));
        assert(instance.parameters.some(p => p.name === "something"));
        assert(instance.parameters.some(p => p.name === "foo"));
        assert(instance.parameters.some(p => p.name === "target.repo"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.addAtomistWebhook, false);
        assert.equal(pi.bar, "carrot");
        assert.equal(pi.name, "foo");
    });

    it("should build on generator", () => {
        const reg: CodeTransformRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({ seed: () => new GitHubRepoRef("a", "b") }),
            parameters:
                addParameters({ name: "foo" })
                    .addParameters({ name: "bar", required: true }),
            transform: async p => p,
        };
        const maker = codeTransformRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert(instance.parameters.some(p => p.name === "foo"));
        // From common
        assert(instance.parameters.some(p => p.name === "targets.repos"));
        assert(instance.parameters.some(p => p.name === "addAtomistWebhook"));
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("should default parameters or in memory project without maker", async () => {
        const g: GeneratorRegistration = {
            name: "foo",
            startingPoint: InMemoryProject.of(new InMemoryProjectFile("a", "b")),
            transform: async p => p,
        };
        const maker = generatorRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), g);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        // It's not actually of this concrete type, but we want to check
        const paramsInstance = instance.freshParametersInstance() as SeedDrivenGeneratorParametersSupport;
        assert.equal(paramsInstance.addAtomistWebhook, false, "Unexpected parameter object " + JSON.stringify(instance));
        assert(!paramsInstance.version, "Should not magically pick up version");
    });

    it("should create command handler from generator", async () => {
        const g: GeneratorRegistration = {
            name: "foo",
            startingPoint: InMemoryProject.of(new InMemoryProjectFile("a", "b")),
            transform: async p => p,
        };
        generatorRegistrationToCommand(null, g);
        const maker = codeTransformRegistrationToCommand(new TestSoftwareDeliveryMachine("test"), g);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        instance.freshParametersInstance();
    });

    it("should create command handler with autoSubmit", async () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            listener: async ci => { return; },
            autoSubmit: true,
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        const md = metadataFromInstance(instance) as CommandHandlerMetadata;
        assert(md.auto_submit);
        assert.strictEqual(md.name, "test");
    });

});
