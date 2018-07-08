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

import { HandleCommand, HandleEvent, logger, Success } from "@atomist/automation-client";
import { declareMappedParameter, declareParameter, declareSecret } from "@atomist/automation-client/internal/metadata/decoratorSupport";
import { OnCommand } from "@atomist/automation-client/onCommand";
import { eventHandlerFrom } from "@atomist/automation-client/onEvent";
import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitHubFallbackReposParameters } from "@atomist/automation-client/operations/common/params/GitHubFallbackReposParameters";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitHubRepoCreationParameters } from "@atomist/automation-client/operations/generate/GitHubRepoCreationParameters";
import { isProject } from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { SdmContext } from "../../api/context/SdmContext";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { CodeTransformRegistration } from "../../api/registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { CommandRegistration } from "../../api/registration/CommandRegistration";
import { EventHandlerRegistration } from "../../api/registration/EventHandlerRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { ParametersBuilder } from "../../api/registration/ParametersBuilder";
import {
    DeclarationType,
    MappedParameterOrSecretDeclaration,
    ParametersDefinition,
    ParametersListing,
} from "../../api/registration/ParametersDefinition";
import {
    CodeTransform,
    toExplicitCodeTransform,
    toScalarCodeTransform,
} from "../../api/registration/ProjectOperationRegistration";
import { createCommand } from "../command/createCommand";
import { codeTransformListener, toCodeTransformParametersMaker } from "../command/editor/codeTransformListener";
import { generatorListener, toGeneratorParametersMaker } from "../command/generator/generatorListener";
import { MachineOrMachineOptions, toMachineOptions } from "./toMachineOptions";

export const GeneratorTag = "generator";
export const TransformTag = "transform";

export function codeTransformRegistrationToCommand<P>(sdm: MachineOrMachineOptions, e: CodeTransformRegistration<any>): Maker<HandleCommand> {
    tagWith(e, TransformTag);
    e.paramsMaker = e.paramsMaker || NoParameters;
    e.paramsMaker = toCodeTransformParametersMaker(e.paramsMaker, e.targets || toMachineOptions(sdm).targets || new GitHubFallbackReposParameters());
    return commandHandlerRegistrationToCommand(sdm, {
        ...e as CommandRegistration<P>,
        listener: ci =>
            withSdmContext(ci, () => codeTransformListener(toScalarCodeTransform(e.transform), e.name, e)(ci)),
    });
}

// tslint:disable-next-line:variable-name
let __sdmContext: SdmContext;

/**
 * Bind the current context so it's accessible even when passed through old style editors
 * @param {SdmContext} c
 * @param {() => Promise<any>} todo
 * @return {Promise<any>}
 */
export function withSdmContext(c: SdmContext, todo: () => Promise<any>): Promise<any> {
    __sdmContext = c;
    try {
        return todo();
    } finally {
        __sdmContext = undefined;
    }
}

function getSdmContext(): SdmContext {
    if (!__sdmContext) {
        throw new Error("Internal error: SDM context must be set");
    }
    return __sdmContext;
}

// This is nasty: We use this to fool our editors into working with the traditional API
/**
 * Convert a CodeTransform into an automation client project editor
 * @param {CodeTransform<any>} ct
 * @return {ProjectEditor<any>}
 */
export function toProjectEditor(ct: CodeTransform<any>): ProjectEditor<any> {
    const ect = toExplicitCodeTransform(ct);
    return async p => {
        return ect(p, getSdmContext());
    };
}

/**
 * Tag the command details with the given tag if it isn't already
 * @param {Partial<CommandDetails>} e
 * @param {string} tag
 */
function tagWith(e: Partial<CommandDetails>, tag: string) {
    if (!e.tags) {
        e.tags = [];
    }
    if (typeof e.tags === "string") {
        e.tags = [e.tags];
    }
    if (!e.tags.includes(tag)) {
        e.tags.push(tag);
    }
}

export function generatorRegistrationToCommand<P = any>(sdm: MachineOrMachineOptions, e: GeneratorRegistration<P>): Maker<HandleCommand<P>> {
    tagWith(e, GeneratorTag);
    if (!e.paramsMaker) {
        e.paramsMaker = NoParameters as any as Maker<P>;
    }
    if (e.startingPoint && isProject(e.startingPoint) && !e.startingPoint.id) {
        // TODO should probably be handled in automation-client
        e.startingPoint.id = new GitHubRepoRef("ignore", "this");
    }
    e.paramsMaker = toGeneratorParametersMaker(e.paramsMaker, e.fallbackTarget || new GitHubRepoCreationParameters());
    return commandHandlerRegistrationToCommand(sdm, {
        ...e as CommandRegistration<P>,
        // Invoke in SDM context so that new style CodeTransforms work
        listener: ci => withSdmContext(ci,
            () => generatorListener(sdm,
                toScalarCodeTransform(e.transform),
                e.name,
                e.startingPoint,
                e)(ci)),
    });
}

export function commandHandlerRegistrationToCommand<P = any>(sdm: MachineOrMachineOptions,
                                                             c: CommandHandlerRegistration<P>): Maker<HandleCommand<P>> {
    return () => createCommand(
        sdm,
        toOnCommand(c),
        c.name,
        c.paramsMaker,
        c,
    );
}

export function eventHandlerRegistrationToEvent(sdm: MachineOrMachineOptions, e: EventHandlerRegistration<any, any>): Maker<HandleEvent> {
    return () => eventHandlerFrom(
        e.listener,
        e.paramsMaker || NoParameters,
        e.subscription,
        e.name,
        e.description,
        e.tags,
    );
}

function toOnCommand<PARAMS>(c: CommandHandlerRegistration<PARAMS>): (sdm: MachineOrMachineOptions) => OnCommand<PARAMS> {
    if (!!c.createCommand) {
        return c.createCommand;
    }
    addParametersDefinedInBuilder(c);
    if (!!c.listener) {
        return () => async (context, parameters) => {
            // const opts = toMachineOptions(sdm);
            // TODO will add this. Currently it doesn't work.
            const credentials = undefined; // opts.credentialsResolver.commandHandlerCredentials(context, undefined);
            // TODO do a look up for associated channels
            const ids: RemoteRepoRef[] = undefined;
            const cli: CommandListenerInvocation = {
                commandName: c.name,
                context,
                parameters,
                addressChannels: (msg, opts) => context.messageClient.respond(msg, opts),
                credentials,
                ids,
            };
            logger.debug("Running command listener %s", cli.commandName);
            try {
                await c.listener(cli);
                return Success;
            } catch (err) {
                logger.error("Error executing command '%s': %s", cli.commandName, err.message);
                return {
                    code: 1,
                    message: err.message,
                };
            }
        };
    }
    throw new Error(`Command '${c.name}' is invalid, as it does not specify a listener or createCommand function`);
}

function addParametersDefinedInBuilder<PARAMS>(c: CommandHandlerRegistration<PARAMS>) {
    const oldMaker = c.paramsMaker || NoParameters;
    if (!!c.parameters) {
        c.paramsMaker = () => {
            let paramsInstance;
            if (!!oldMaker) {
                paramsInstance = toFactory(oldMaker)();
            } else {
                paramsInstance = {};
                paramsInstance.__kind = "command-handler";
            }
            const paramListing = toParametersListing(c.parameters);
            paramListing.parameters.forEach(p => {
                paramsInstance[p.name] = p.defaultValue;
                declareParameter(paramsInstance, p.name, p);
            });
            paramListing.mappedParameters.forEach(p =>
                declareMappedParameter(paramsInstance, p.name, p.uri, p.required));
            paramListing.secrets.forEach(p =>
                declareSecret(paramsInstance, p.name, p.uri));
            return paramsInstance;
        };
    }
}

function isMappedParameterOrSecretDeclaration(x: any): x is MappedParameterOrSecretDeclaration {
    const maybe = x as MappedParameterOrSecretDeclaration;
    return !!maybe && !!maybe.type;
}

function isParametersListing(p: ParametersDefinition): p is ParametersListing {
    const maybe = p as ParametersListing;
    return maybe.parameters !== undefined && maybe.mappedParameters !== undefined;
}

function toParametersListing(p: ParametersDefinition): ParametersListing {
    if (isParametersListing(p)) {
        return p;
    }
    const builder = new ParametersBuilder();
    for (const name of Object.getOwnPropertyNames(p)) {
        const value = p[name];
        if (isMappedParameterOrSecretDeclaration(value)) {
            switch (value.type) {
                case DeclarationType.mapped :
                    builder.addMappedParameters({ name, uri: value.uri, required: value.required });
                    break;
                case DeclarationType.secret :
                    builder.addSecrets({ name, uri: value.uri });
                    break;
            }
        } else {
            builder.addParameters({ name, ...value });
        }
    }
    return builder;
}
