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
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import {
    EditorFactory,
    GeneratorCommandDetails,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import { generate } from "@atomist/automation-client/operations/generate/generatorUtils";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { addAtomistWebhook } from "@atomist/automation-client/operations/generate/support/addAtomistWebhook";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { isProject, Project } from "@atomist/automation-client/project/Project";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { StartingPoint } from "../../..";
import { SoftwareDeliveryMachineOptions } from "../../../api/machine/SoftwareDeliveryMachineOptions";
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
export function generatorCommand<P extends SeedDrivenGeneratorParameters>(sdm: MachineOrMachineOptions,
                                                                          editorFactory: EditorFactory<P>,
                                                                          name: string,
                                                                          paramsMaker: Maker<P>,
                                                                          startingPoint: StartingPoint,
                                                                          details: Partial<GeneratorCommandDetails<P>> = {}): HandleCommand {
    const detailsToUse: GeneratorCommandDetails<P> = {
        ...defaultDetails(toMachineOptions(sdm), name),
        ...details,
    };
    return commandHandlerFrom(handleGenerate(editorFactory, detailsToUse, startingPoint),
        paramsMaker, name,
        detailsToUse.description, detailsToUse.intent, detailsToUse.tags);
}

function handleGenerate<P extends SeedDrivenGeneratorParameters>(editorFactory: EditorFactory<P>,
                                                                 details: GeneratorCommandDetails<P>,
                                                                 startingPoint: StartingPoint): OnCommand<P> {

    return (ctx: HandlerContext, parameters: P) => {
        return handle(ctx, editorFactory, parameters, details, startingPoint);
    };
}

async function handle<P extends SeedDrivenGeneratorParameters>(ctx: HandlerContext,
                                                               editorFactory: EditorFactory<P>,
                                                               params: P,
                                                               details: GeneratorCommandDetails<P>,
                                                               startingPoint: StartingPoint): Promise<RedirectResult> {
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
        await ctx.messageClient.respond(`Cloned seed project from ${params.source.repoRef.url}`);
        return repoLoader(params.source.repoRef);
    }
    if (isProject(startingPoint)) {
        await ctx.messageClient.respond(`Using seed project specified in registration`);
        return startingPoint;
    } else {
        await ctx.messageClient.respond(`Cloned seed project from ${params.source.repoRef.url}`);
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
