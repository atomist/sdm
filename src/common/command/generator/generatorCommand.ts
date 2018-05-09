/**
 * Create a generator function wrapping the given transform
 * @param {AnyProjectEditor} editorFactory editor for the transformation
 * @param factory construction function
 * @param {string} name name of the generator
 * @param {string} details object allowing customization beyond reasonable defaults
 * @return {HandleCommand}
 */
import { BaseSeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/BaseSeedDrivenGeneratorParameters";
import { EditorFactory, GeneratorCommandDetails } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { HandleCommand, HandlerContext, RedirectResult } from "@atomist/automation-client";
import { commandHandlerFrom, OnCommand } from "@atomist/automation-client/onCommand";
import { generate } from "@atomist/automation-client/operations/generate/generatorUtils";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { allReposInTeam } from "../editor/allReposInTeam";
import { projectLoaderRepoLoader } from "../../repo/projectLoaderRepoLoader";
import { CachingProjectLoader } from "../../repo/CachingProjectLoader";
import { RemoteGitProjectPersister } from "@atomist/automation-client/operations/generate/remoteGitProjectPersister";
import { addAtomistWebhook } from "@atomist/automation-client/operations/generate/support/addAtomistWebhook";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { Project } from "@atomist/automation-client/project/Project";

function defaultDetails<P extends BaseSeedDrivenGeneratorParameters>(name: string): GeneratorCommandDetails<P> {
    return {
        description: name,
        repoFinder: allReposInTeam(),
        repoLoader: (p: P) => projectLoaderRepoLoader(new CachingProjectLoader(), p.target.credentials),
        projectPersister: RemoteGitProjectPersister,
        redirecter: () => undefined,
    };
}

export function generatorHandler<P extends BaseSeedDrivenGeneratorParameters>(editorFactory: EditorFactory<P>,
                                                                              factory: Maker<P>,
                                                                              name: string,
                                                                              details: Partial<GeneratorCommandDetails<P>> = {}): HandleCommand {

    const detailsToUse: GeneratorCommandDetails<P> = {
        ...defaultDetails(name),
        ...details,
    };
    return commandHandlerFrom(handleGenerate(editorFactory, detailsToUse), factory, name,
        detailsToUse.description, detailsToUse.intent, detailsToUse.tags);
}

function handleGenerate<P extends BaseSeedDrivenGeneratorParameters>(editorFactory: EditorFactory<P>,
                                                                     details: GeneratorCommandDetails<P>): OnCommand<P> {

    return (ctx: HandlerContext, parameters: P) => {
        return handle(ctx, editorFactory, parameters, details);
    };
}

function handle<P extends BaseSeedDrivenGeneratorParameters>(ctx: HandlerContext,
                                                             editorFactory: EditorFactory<P>,
                                                             params: P,
                                                             details: GeneratorCommandDetails<P>): Promise<RedirectResult> {

    return ctx.messageClient.respond(`Starting project generation for ${params.target.owner}/${params.target.repo}`)
        .then(() => {
            return generate(
                startingPoint(params, ctx, details.repoLoader(params), details)
                    .then(p => {
                        return ctx.messageClient.respond(`Cloned seed project from \`${params.source.owner}/${params.source.repo}\``)
                            .then(() => p);
                    }),
                ctx,
                params.target.credentials,
                editorFactory(params, ctx),
                details.projectPersister,
                params.target.repoRef,
                params,
                details.afterAction,
            )
                .then(r => ctx.messageClient.respond(`Created and pushed new project`)
                    .then(() => r));
        })
        .then(r => {
            if (isGitHubRepoRef(r.target.id)) {
                return hasOrgWebhook(params.target.owner, ctx)
                    .then(webhookInstalled => {
                        if (!webhookInstalled) {
                            return addAtomistWebhook((r.target as GitProject), params);
                        } else {
                            return Promise.resolve(r);
                        }
                    });
            }
            return Promise.resolve(r);
        })
        .then(r => ctx.messageClient.respond(`Successfully created new project`).then(() => r))
        .then(r => ({
            code: 0,
            // Redirect to our local project page
            redirect: details.redirecter(params.target),
        }));
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
function startingPoint<P extends BaseSeedDrivenGeneratorParameters>(params: P,
                                                                    ctx: HandlerContext,
                                                                    repoLoader: RepoLoader,
                                                                    details: GeneratorCommandDetails<any>): Promise<Project> {

    return repoLoader(params.source.repoRef);
}
