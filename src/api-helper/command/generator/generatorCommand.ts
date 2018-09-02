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
    HandlerContext,
    RedirectResult,
} from "@atomist/automation-client";
import {
    commandHandlerFrom,
    OnCommand,
} from "@atomist/automation-client/onCommand";
import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectAction } from "@atomist/automation-client/operations/common/projectAction";
import {
    isRemoteRepoRef,
    RemoteRepoRef,
    RepoRef,
} from "@atomist/automation-client/operations/common/RepoId";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { generate, ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { RepoCreationParameters } from "@atomist/automation-client/operations/generate/RepoCreationParameters";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { addAtomistWebhook } from "@atomist/automation-client/operations/generate/support/addAtomistWebhook";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import {
    isProject,
    Project,
} from "@atomist/automation-client/project/Project";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import {
    Maker,
    toFactory,
} from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { SoftwareDeliveryMachineOptions } from "../../../api/machine/SoftwareDeliveryMachineOptions";
import { StartingPoint } from "../../../api/registration/GeneratorRegistration";
import { projectLoaderRepoLoader } from "../../machine/projectLoaderRepoLoader";
import {
    MachineOrMachineOptions,
    toMachineOptions,
} from "../../machine/toMachineOptions";
import { CachingProjectLoader } from "../../project/CachingProjectLoader";

/**
 * Create a command handler for project generation
 * @param sdm this machine or its options
 * @param {EditorFactory<P extends SeedDrivenGeneratorParameters>} editorFactory to create editorCommand to perform transformation
 * @param {Maker<P extends SeedDrivenGeneratorParameters>} paramsMaker
 * @param {string} name
 * @param {Partial<GeneratorCommandDetails<P extends SeedDrivenGeneratorParameters>>} details
 * @return {HandleCommand}
 */
export function generatorCommand<P>(sdm: MachineOrMachineOptions,
                                    editorFactory: EditorFactory<P>,
                                    name: string,
                                    paramsMaker: Maker<P>,
                                    fallbackTarget: Maker<RepoCreationParameters>,
                                    startingPoint: StartingPoint<P>,
                                    details: Partial<GeneratorCommandDetails<any>> = {}): HandleCommand {
    const detailsToUse: GeneratorCommandDetails<any> = {
        ...defaultDetails(toMachineOptions(sdm), name),
        ...details,
    };
    return commandHandlerFrom(handleGenerate(editorFactory, detailsToUse, startingPoint),
        toGeneratorParametersMaker<P>(
            paramsMaker,
            toFactory(fallbackTarget)()),
        name,
        detailsToUse.description, detailsToUse.intent, detailsToUse.tags);
}

export type EditorFactory<P> = (params: P, ctx: HandlerContext) => AnyProjectEditor<P>;
interface GeneratorCommandDetails<P extends SeedDrivenGeneratorParameters> extends CommandDetails {

    redirecter: (r: RepoRef) => string;
    projectPersister?: ProjectPersister;
    afterAction?: ProjectAction<P>;
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
function toGeneratorParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>,
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
    return !!maybe && !!maybe.target;
}

function handleGenerate<P extends SeedDrivenGeneratorParameters>(editorFactory: EditorFactory<P>,
                                                                 details: GeneratorCommandDetails<P>,
                                                                 startingPoint: StartingPoint<P>): OnCommand<P> {

    return (ctx: HandlerContext, parameters: P) => {
        return handle(ctx, editorFactory, parameters, details, startingPoint);
    };
}

async function handle<P extends SeedDrivenGeneratorParameters>(ctx: HandlerContext,
                                                               editorFactory: EditorFactory<P>,
                                                               params: P,
                                                               details: GeneratorCommandDetails<P>,
                                                               startingPoint: StartingPoint<P>): Promise<RedirectResult> {
    const r = await generate(
        computeStartingPoint(params, ctx, details.repoLoader(params), details, startingPoint),
        ctx,
        params.target.credentials,
        editorFactory(params, ctx),
        details.projectPersister,
        params.target.repoRef,
        params,
        details.afterAction,
    );
    await ctx.messageClient.respond(`Created and pushed new project ${params.target.repoRef.url}`);
    if (isGitHubRepoRef(r.target.id) && params.addAtomistWebhook) {
        const webhookInstalled = await hasOrgWebhook(params.target.repoRef.owner, ctx);
        if (!webhookInstalled) {
            await addAtomistWebhook((r.target as GitProject), params);
        }
    }
    return {
        code: 0,
        // Redirect to local project page
        redirect: details.redirecter(params.target.repoRef),
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
 * Retrieve a seed. Set the seed location on the parameters if possible and necessary.
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
                                                                             startingPoint: StartingPoint<P>): Promise<Project> {
    if (!startingPoint) {
        if (!params.source || !params.source.repoRef) {
            throw new Error("If startingPoint is not provided in GeneratorRegistration, parameters.source must specify seed project location: " +
                `Offending registration had intent ${details.intent}`);
        }
        await ctx.messageClient.respond(`Cloning seed project from parameters: ${params.source.repoRef.url}`);
        return repoLoader(params.source.repoRef);
    }
    if (isProject(startingPoint)) {
        await ctx.messageClient.respond(`Using starting point project specified in registration`);
        return startingPoint;
    } else if (isRemoteRepoRef(startingPoint as RepoRef)) {
        await ctx.messageClient.respond(`Cloning seed project from starting point: ${(startingPoint as RemoteRepoRef).url}`);
        const repoRef = startingPoint as RemoteRepoRef;
        params.source = { repoRef };
        return repoLoader(repoRef);
    } else {
        // It's a function that takes the parameters and returns either a project or a RemoteRepoRef
        const rr: RemoteRepoRef | Project | Promise<Project> = (startingPoint as any)(params);
        if (isProjectPromise(rr)) {
            await rr.then(async (p: Project) =>
                ctx.messageClient.respond(`Using dynamically chosen starting point project \`${p.id.owner}:${p.id.repo}\``),
            );
            return rr;
        }
        if (isProject(rr)) {
            await ctx.messageClient.respond(`Using dynamically chosen starting point project \`${rr.id.owner}:${rr.id.repo}\``);
            // params.source will remain undefined in this case
            return rr;
        } else {
            await ctx.messageClient.respond(`Cloning dynamically chosen starting point from ${rr.url}`);
            params.source = { repoRef: rr };
            return repoLoader(rr);
        }
    }
}

function isProjectPromise(a: any): a is Promise<Project> {
    return !!a.then;
}

function defaultDetails<P extends SeedDrivenGeneratorParameters>(opts: SoftwareDeliveryMachineOptions, name: string): GeneratorCommandDetails<P> {
    return {
        description: name,
        repoFinder: opts.repoFinder,
        repoLoader: (p: P) => projectLoaderRepoLoader(opts.projectLoader || new CachingProjectLoader(),
            p.target.credentials, true),
        projectPersister: opts.projectPersister,
        redirecter: () => undefined,
    };
}
