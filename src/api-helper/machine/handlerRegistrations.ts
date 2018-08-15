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
    HandleCommand,
    HandleEvent,
    HandlerContext,
    logger,
    Success,
} from "@atomist/automation-client";
import {
    declareMappedParameter,
    declareParameter,
    declareSecret,
} from "@atomist/automation-client/internal/metadata/decoratorSupport";
import { OnCommand } from "@atomist/automation-client/onCommand";
import { eventHandlerFrom } from "@atomist/automation-client/onEvent";
import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { andFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { doWithAllRepos } from "@atomist/automation-client/operations/common/repoUtils";
import { editAll } from "@atomist/automation-client/operations/edit/editAll";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import {
    failedEdit,
    ProjectEditor,
    successfulEdit,
} from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { GitHubRepoCreationParameters } from "@atomist/automation-client/operations/generate/GitHubRepoCreationParameters";
import {
    isProject,
    Project,
} from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import {
    Maker,
    toFactory,
} from "@atomist/automation-client/util/constructionUtils";
import { GitHubRepoTargets } from "../../api/command/target/GitHubRepoTargets";
import { isTransformModeSuggestion } from "../../api/command/target/TransformModeSuggestion";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import {
    isValidationError,
    RepoTargets,
} from "../../api/machine/RepoTargets";
import { ProjectPredicate } from "../../api/mapping/PushTest";
import {
    CodeInspectionRegistration,
    InspectionResult,
} from "../../api/registration/CodeInspectionRegistration";
import {
    CodeTransform,
    CodeTransformOrTransforms,
} from "../../api/registration/CodeTransform";
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
import { createCommand } from "../command/createCommand";
import {
    generatorCommand,
    isSeedDrivenGeneratorParameters,
} from "../command/generator/generatorCommand";
import { chattyEditor } from "../command/transform/chattyEditor";
import { projectLoaderRepoLoader } from "./projectLoaderRepoLoader";
import {
    isRepoTargetingParameters,
    RepoTargetingParameters,
} from "./RepoTargetingParameters";
import {
    MachineOrMachineOptions,
    toMachineOptions,
} from "./toMachineOptions";

export const GeneratorTag = "generator";
export const InspectionTag = "inspection";
export const TransformTag = "transform";

export function codeTransformRegistrationToCommand(sdm: MachineOrMachineOptions, ctr: CodeTransformRegistration<any>): Maker<HandleCommand> {
    tagWith(ctr, TransformTag);
    const mo = toMachineOptions(sdm);
    addParametersDefinedInBuilder(ctr);
    ctr.paramsMaker = toRepoTargetingParametersMaker(
        ctr.paramsMaker || NoParameters,
        ctr.targets || mo.targets || GitHubRepoTargets);
    const description = ctr.description || ctr.name;
    const asCommand: CommandHandlerRegistration = {
        description,
        ...ctr as CommandRegistration<any>,
        listener: async ci => {
            const targets = (ci.parameters as RepoTargetingParameters).targets;
            const vr = targets.bindAndValidate();
            if (isValidationError(vr)) {
                return ci.addressChannels(`:no_entry: Invalid parameters to code transform: ${vr.message}`);
            }
            const repoFinder: RepoFinder = !!(ci.parameters as RepoTargetingParameters).targets.repoRef ?
                () => Promise.resolve([(ci.parameters as RepoTargetingParameters).targets.repoRef]) :
                ctr.repoFinder || toMachineOptions(sdm).repoFinder;
            const repoLoader: RepoLoader = !!ctr.repoLoader ?
                ctr.repoLoader(ci.parameters) :
                projectLoaderRepoLoader(
                    mo.projectLoader,
                    (ci.parameters as RepoTargetingParameters).targets.credentials,
                    false);

            const editMode = toEditModeOrFactory(ctr, ci);
            const results = await editAll<any, any>(
                ci.context,
                ci.credentials,
                chattyEditor(ctr.name, toScalarProjectEditor(ctr.transform, ctr.projectTest)),
                editMode,
                ci.parameters,
                repoFinder,
                andFilter(targets.test, ctr.repoFilter),
                repoLoader);
            if (!!ctr.react) {
                await ctr.react(results, ci);
            } else {
                logger.info("No react function to react to results of code transformation '%s'", ctr.name);
            }
        },
    };
    return commandHandlerRegistrationToCommand(sdm, asCommand);
}

export function codeInspectionRegistrationToCommand<R>(sdm: MachineOrMachineOptions, cir: CodeInspectionRegistration<R, any>): Maker<HandleCommand> {
    tagWith(cir, InspectionTag);
    const mo = toMachineOptions(sdm);
    addParametersDefinedInBuilder(cir);
    cir.paramsMaker = toRepoTargetingParametersMaker(
        cir.paramsMaker || NoParameters,
        cir.targets || mo.targets || GitHubRepoTargets);
    const description = cir.description || cir.name;
    const asCommand: CommandHandlerRegistration = {
        description,
        ...cir as CommandRegistration<any>,
        listener: async ci => {
            const targets = (ci.parameters as RepoTargetingParameters).targets;
            const vr = targets.bindAndValidate();
            if (isValidationError(vr)) {
                return ci.addressChannels(`:no_entry: Invalid parameters to code inspection: ${vr.message}`);
            }
            const action: (p: Project, params: any) => Promise<InspectionResult<R>> = async p => {
                if (!!cir.projectTest && !(await cir.projectTest(p))) {
                    return { repoId: p.id, result: undefined };
                }
                return { repoId: p.id, result: await cir.inspection(p, ci) };
            };
            const repoFinder: RepoFinder = !!(ci.parameters as RepoTargetingParameters).targets.repoRef ?
                () => Promise.resolve([(ci.parameters as RepoTargetingParameters).targets.repoRef]) :
                cir.repoFinder || toMachineOptions(sdm).repoFinder;
            const repoLoader: RepoLoader = !!cir.repoLoader ?
                cir.repoLoader(ci.parameters) :
                projectLoaderRepoLoader(
                    mo.projectLoader,
                    (ci.parameters as RepoTargetingParameters).targets.credentials,
                    true);
            const results = await doWithAllRepos<InspectionResult<R>, any>(
                ci.context,
                ci.credentials,
                action,
                ci.parameters,
                repoFinder,
                andFilter(targets.test, cir.repoFilter),
                repoLoader);
            if (!!cir.react) {
                await cir.react(results, ci);
            } else {
                logger.info("No react function to react to results of code inspection '%s'", cir.name);
            }
        },
    };
    return commandHandlerRegistrationToCommand(sdm, asCommand);
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
    addParametersDefinedInBuilder(e);
    return () => generatorCommand(
        sdm,
        () => toScalarProjectEditor(e.transform),
        e.name,
        e.paramsMaker,
        e.fallbackTarget || GitHubRepoCreationParameters,
        e.startingPoint,
        e,
    );
}

export function commandHandlerRegistrationToCommand<P = NoParameters>(sdm: MachineOrMachineOptions,
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

function toOnCommand<PARAMS>(c: CommandHandlerRegistration<any>): (sdm: MachineOrMachineOptions) => OnCommand<PARAMS> {
    addParametersDefinedInBuilder(c);
    return () => async (context, parameters) => {
        // const opts = toMachineOptions(sdm);
        const cli = toCommandListenerInvocation(c, context, parameters);
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

function toCommandListenerInvocation<P>(c: CommandRegistration<P>, context: HandlerContext, parameters: P): CommandListenerInvocation {
    let credentials; // opts.credentialsResolver.commandHandlerCredentials(context, undefined);
    let ids: RemoteRepoRef[];
    if (isSeedDrivenGeneratorParameters(parameters)) {
        credentials = parameters.target.credentials;
        ids = [parameters.target.repoRef];
    } else if (isRepoTargetingParameters(parameters)) {
        credentials = parameters.targets.credentials;
        ids = !!parameters.targets.repoRef ? [parameters.targets.repoRef] : undefined;
    }
    // TODO do a look up for associated channels
    const addressChannels = (msg, opts) => context.messageClient.respond(msg, opts);
    return {
        commandName: c.name,
        context,
        parameters,
        addressChannels,
        credentials,
        ids,
    };
}

/**
 * Add to the existing ParametersMaker any parameters defined in the builder itself
 * @param {CommandHandlerRegistration<PARAMS>} c
 */
function addParametersDefinedInBuilder<PARAMS>(c: CommandRegistration<PARAMS>) {
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

export function toParametersListing(p: ParametersDefinition): ParametersListing {
    if (isParametersListing(p)) {
        return p;
    }
    const builder = new ParametersBuilder();
    for (const name of Object.getOwnPropertyNames(p)) {
        const value = p[name];
        if (isMappedParameterOrSecretDeclaration(value)) {
            switch (value.type) {
                case DeclarationType.mapped:
                    builder.addMappedParameters({ name, uri: value.uri, required: value.required });
                    break;
                case DeclarationType.secret:
                    builder.addSecrets({ name, uri: value.uri });
                    break;
            }
        } else {
            builder.addParameters({ name, ...value });
        }
    }
    return builder;
}

export function toScalarProjectEditor<PARAMS>(ctot: CodeTransformOrTransforms<PARAMS>, projectPredicate?: ProjectPredicate): ProjectEditor<PARAMS> {
    const unguarded = Array.isArray(ctot) ?
        chainEditors(...ctot.map(toProjectEditor)) :
        toProjectEditor(ctot);
    if (!!projectPredicate) {
        // Filter out this project if it doesn't match the predicate
        return async (p, context, params) => {
            return (await projectPredicate(p)) ?
                unguarded(p, context, params) :
                Promise.resolve({ success: true, edited: false, target: p });
        };
    }
    return unguarded;
}

// Convert to an old style, automation-client, ProjectEditor to allow
// underlying code to work for now
function toProjectEditor<P>(ct: CodeTransform<P>): ProjectEditor<P> {
    return async (p, ctx, params) => {
        const ci = toCommandListenerInvocation(p, ctx, params);
        // Mix in handler context for old style callers
        const r = await ct(p, {
            ...ctx,
            ...ci,
        } as CommandListenerInvocation<P> & HandlerContext,
            params);
        try {
            return isProject(r) ? successfulEdit(r, undefined) : r;
        } catch (e) {
            return failedEdit(p, e);
        }
    };
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @param targets targets parameters to set if necessary
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
export function toRepoTargetingParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>,
                                                       targets: Maker<RepoTargets>): Maker<RepoTargetingParameters & PARAMS> {
    const sampleParams = toFactory(paramsMaker)();
    return isRepoTargetingParameters(sampleParams) ?
        paramsMaker as Maker<RepoTargetingParameters & PARAMS> :
        () => {
            const rawParms: PARAMS = toFactory(paramsMaker)();
            const allParms = rawParms as RepoTargetingParameters & PARAMS;
            const targetsInstance: RepoTargets = toFactory(targets)();
            allParms.targets = targetsInstance;
            return allParms;
        };
}

function toEditModeOrFactory<P>(ctr: CodeTransformRegistration<P>, ci: CommandListenerInvocation<P>) {
    const description = ctr.description || ctr.name;
    if (!!ctr.transformPresentation) {
        return (p: Project) => ctr.transformPresentation(ci, p);
    }
    // Get EditMode from parameters if possible
    if (isTransformModeSuggestion(ci.parameters)) {
        const tms = ci.parameters;
        return new PullRequest(
            tms.desiredBranchName,
            tms.desiredPullRequestTitle || description);
    }
    // Default it if not supplied
    return new PullRequest(
        `transform-${gitBranchCompatible(ctr.name)}-${Date.now()}`,
        description);
}

function gitBranchCompatible(name: string) {
    return name.replace(" ", "_"); // What else??
}
