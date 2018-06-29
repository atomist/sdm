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
import { addParameter } from "../../../src/api/registration/CommandRegistration";
import { EditorRegistration } from "../../../src/api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../../src/api/registration/GeneratorRegistration";

describe("command registrations", () => {

    it("parameter builder should set parameters", () => {
        const reg: CommandHandlerRegistration<{ foo: string, bar: string }> = {
            name: "test",
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true}),
            listener: async ci => {
                return ci.addressChannels(ci.parameters.foo + ci.parameters.bar);
            },
        };
        const maker = commandHandlerRegistrationToCommand(null, reg);
        const instance = toFactory(maker)() as SelfDescribingHandleCommand;
        assert.equal(instance.parameters.length, 2);
        const pi = instance.freshParametersInstance();
        pi.name = "foo";
        assert.equal(pi.name, "foo");
    });

    it("parameter builder should set mapped parameters", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true})
                    .addMappedParameter({name: "x", uri: "http://thing"}),
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
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true})
                    .addSecret({name: "x", uri: "http://thing"}),
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

    it("should combine builder and maker", () => {
        const reg: CommandHandlerRegistration = {
            name: "test",
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({seed: () => new GitHubRepoRef("a", "b")}),
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true}),
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
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true}),
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
            paramsBuilder:
                addParameter({name: "foo"})
                    .addParameter({name: "bar", required: true}),
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
