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
    HandlerContext,
    RedirectResult,
} from "@atomist/automation-client";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import {
    GeneratorCommandDetails,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import { generate } from "@atomist/automation-client/operations/generate/generatorUtils";
import { RepoCreationParameters } from "@atomist/automation-client/operations/generate/RepoCreationParameters";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { addAtomistWebhook } from "@atomist/automation-client/operations/generate/support/addAtomistWebhook";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import {
    isProject,
    Project,
} from "@atomist/automation-client/project/Project";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { CommandListener, CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachineOptions } from "../../../api/machine/SoftwareDeliveryMachineOptions";
import { StartingPoint } from "../../../api/registration/GeneratorRegistration";
import { CodeTransform } from "../../../api/registration/ProjectOperationRegistration";
import { toProjectEditor } from "../../machine/handlerRegistrations";
import { projectLoaderRepoLoader } from "../../machine/projectLoaderRepoLoader";
import {
    MachineOrMachineOptions,
    toMachineOptions,
} from "../../machine/toMachineOptions";
import { CachingProjectLoader } from "../../project/CachingProjectLoader";

/**
 * Create a command handler for project generation
 * @param sdm this machine or its options
 * @param {string} name
 * @param {Partial<GeneratorCommandDetails<P extends SeedDrivenGeneratorParameters>>} details
 * @return {HandleCommand}
 */
export function generatorListener<P>(sdm: MachineOrMachineOptions,
                                     transform: CodeTransform<P>,
                                     name: string,
                                     startingPoint: StartingPoint,
                                     details: Partial<GeneratorCommandDetails<any>> = {}): CommandListener<P> {
    const detailsToUse: GeneratorCommandDetails<any> = {
        ...defaultDetails(toMachineOptions(sdm), name),
        ...details,
    };
    return handleGenerate(transform, detailsToUse, startingPoint);
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
export function toGeneratorParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>,
                                                   target: RepoCreationParameters): Maker<SeedDrivenGeneratorParameters & PARAMS> {
    const sampleParams = toFactory(paramsMaker)();
    return isSeedDrivenGeneratorParameters(sampleParams) ?
        paramsMaker as Maker<SeedDrivenGeneratorParameters & PARAMS> as any :
        () => {
            // This way we won't bother with source, but rely on startingPoint
            const rawParms: PARAMS = toFactory(paramsMaker)();
            const allParms = rawParms as SeedDrivenGeneratorParameters & PARAMS;
            allParms.target = target;
            allParms.addAtomistWebhook = allParms.addAtomistWebhook || false;
            return allParms;
        };
}

export function isSeedDrivenGeneratorParameters(p: any): p is SeedDrivenGeneratorParameters {
    const maybe = p as SeedDrivenGeneratorParameters;
    return !!maybe.target;
}

function handleGenerate<P extends SeedDrivenGeneratorParameters>(transform: CodeTransform<P>,
                                                                 details: GeneratorCommandDetails<P>,
                                                                 startingPoint: StartingPoint): CommandListener<P> {

    return ci => {
        return handle(ci, transform, details, startingPoint);
    };
}

async function handle<P extends SeedDrivenGeneratorParameters>(ci: CommandListenerInvocation<P>,
                                                               transform: CodeTransform<P>,
                                                               details: GeneratorCommandDetails<P>,
                                                               startingPoint: StartingPoint): Promise<RedirectResult> {
    const r = await generate(
        computeStartingPoint(ci.parameters, ci.context, details.repoLoader(ci.parameters), details, startingPoint),
        ci.context,
        ci.parameters.target.credentials,
        toProjectEditor(transform),
        details.projectPersister,
        ci.parameters.target.repoRef,
        ci.parameters,
        details.afterAction,
    );
    await ci.addressChannels(`Created and pushed new project ${ci.parameters.target.repoRef.url}`);
    if (isGitHubRepoRef(r.target.id) && ci.parameters.addAtomistWebhook) {
        const webhookInstalled = await hasOrgWebhook(ci.parameters.target.repoRef.owner, ci.context);
        if (!webhookInstalled) {
            await addAtomistWebhook((r.target as GitProject), ci.parameters);
        }
    }
    return {
        code: 0,
        // Redirect to local project page
        redirect: details.redirecter(ci.parameters.target.repoRef),
    };
}

const OrgWebhookQuery = `query OrgWebhook($owner: String!) {
  Webhook(webhookType: organization) {
    org(owner: $owner) @required {
      owner
    }
  }
}`;

async function hasOrgWebhook(owner: string, ctx: HandlerContext): Promise<boolean> {
    const orgHooks = await ctx.graphClient.query<any, any>({
        query: OrgWebhookQuery,
        variables: {
            owner,
        },
        options: QueryNoCacheOptions,
    });
    const hookOwner = _.get(orgHooks, "Webhook[0].org.owner");
    return hookOwner === owner;
}

/**
 * Retrieve a seed
 * @param {HandlerContext} ctx
 * @param {RepoLoader} repoLoader
 * @param {P} params
 * @param details command details
 * @return {Promise<Project>}
 */
async function computeStartingPoint<P extends SeedDrivenGeneratorParameters>(params: P,
                                                                             ctx: HandlerContext,
                                                                             repoLoader: RepoLoader,
                                                                             details: GeneratorCommandDetails<any>,
                                                                             startingPoint: StartingPoint): Promise<Project> {
    if (!startingPoint) {
        await ctx.messageClient.respond(`Cloning seed project from parameters: ${params.source.repoRef.url}`);
        return repoLoader(params.source.repoRef);
    }
    if (isProject(startingPoint)) {
        await ctx.messageClient.respond(`Using starting point project specified in registration`);
        return startingPoint;
    } else {
        await ctx.messageClient.respond(`Cloning seed project from starting point: ${startingPoint.url}`);
        return repoLoader(startingPoint);
    }
}

function defaultDetails<P extends SeedDrivenGeneratorParameters>(opts: SoftwareDeliveryMachineOptions, name: string): GeneratorCommandDetails<P> {
    return {
        description: name,
        repoFinder: opts.repoFinder,
        repoLoader: (p: P) => projectLoaderRepoLoader(opts.projectLoader || new CachingProjectLoader(), p.target.credentials),
        projectPersister: opts.projectPersister,
        redirecter: () => undefined,
    };
}
