/*
 * Copyright © 2020 Atomist, Inc.
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

import { configurationValue } from "@atomist/automation-client/lib/configuration";
import {
    Parameters,
    Secret,
    Secrets,
} from "@atomist/automation-client/lib/decorators";
import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import {
    ProviderType as RepoProviderType,
    RemoteRepoRef,
} from "@atomist/automation-client/lib/operations/common/RepoId";
import * as _ from "lodash";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";
import {
    GitHubAppInstallationByOwner,
    ProviderType,
    ScmProviderByType,
} from "../../../typings/types";

/**
 * Type to implement different strategies to obtain a GitHub token
 */
type ObtainToken = (context: HandlerContext, id?: RemoteRepoRef) => Promise<string | undefined>;

@Parameters()
export class GitHubCredentialsResolver implements CredentialsResolver {

    @Secret(Secrets.OrgToken)
    public readonly orgToken: string;

    public async eventHandlerCredentials(context: HandlerContext,
                                         id?: RemoteRepoRef): Promise<ProjectOperationCredentials> {
        return this.credentials(
            [
                obtainTokenFromConfiguration(this),
                ObtainTokenFromIncomingMessage,
                ObtainTokenFromGitHubApp,
                ObtainTokenFromProvider,
            ],
            context,
            id);
    }

    public async commandHandlerCredentials(context: HandlerContext,
                                           id?: RemoteRepoRef): Promise<ProjectOperationCredentials> {
        return this.credentials(
            [
                ObtainTokenFromIncomingMessage,
                obtainTokenFromConfiguration(this),
                ObtainTokenFromGitHubApp,
                ObtainTokenFromProvider,
            ],
            context,
            id);
    }

    private async credentials(obtainTokens: ObtainToken[],
                              context: HandlerContext,
                              id?: RemoteRepoRef): Promise<ProjectOperationCredentials> {

        for (const obtainToken of obtainTokens) {
            const token = await obtainToken(context, id);
            if (hasToken(token)) {
                return { token };
            }
        }

        throw new Error("No GitHub token available! Please add a token to the SDM configuration at 'sdm.github.token' "
            + "or authenticate the GitHub SCM provider from the web app or CLI.");
    }
}

/**
 * Obtain a org or user token from the incoming event or command invocation
 */
const ObtainTokenFromIncomingMessage: ObtainToken = async ctx => {
    // Try to obtain the token from the incoming event or command
    const actx: AutomationContextAware = ctx as any;
    if (!!actx.trigger && !!actx.trigger.secrets) {
        let secret = actx.trigger.secrets.find(s => s.uri === Secrets.OrgToken);
        if (secret && hasToken(secret.value)) {
            return secret.value;
        }
        secret = actx.trigger.secrets.find(s => s.uri.startsWith(Secrets.UserToken));
        if (secret && hasToken(secret.value)) {
            return secret.value;
        }
    }
    return undefined;
};

/**
 * Obtain a token from an SCMProvider
 */
const ObtainTokenFromProvider: ObtainToken = async (ctx, id) => {
    // Check the graph to see if we have a token on the provider
    if (!!id && (id.providerType === RepoProviderType.github_com)) {
        const token = await fetchTokenByProviderType(ProviderType.github_com, ctx);
        if (hasToken(token)) {
            return token;
        }
    }
    return undefined;
};

/**
 * Obtain a token from an GitHubAppInstallation
 */
const ObtainTokenFromGitHubApp: ObtainToken = async (ctx, id) => {
    // Check the graph to see if we have a token on the GitHubAppInstallation
    if (!!id && (id.providerType === RepoProviderType.github_com)) {
        const token = await fetchTokenByGitHubAppName(id.owner, ctx);
        if (hasToken(token)) {
            return token;
        }
    }
    return undefined;
};

/**
 * Obtain a token from the SDM configuration
 */
function obtainTokenFromConfiguration(resolver: GitHubCredentialsResolver): ObtainToken {
    return async () => {
        if (hasToken(configurationValue("token", "null"))) {
            return configurationValue<string>("token");
        } else if (hasToken(configurationValue("sdm.github.token", "null"))) {
            return configurationValue<string>("sdm.github.token");
        }
        return undefined;
    };
}

function hasToken(token: string): boolean {
    if (!token) {
        return false;
        // "null" as string is being sent when the orgToken can't be determined by the api
    } else if (token === "null" || token === "undefined") {
        return false;
    }
    return true;
}

async function fetchTokenByProviderType(providerType: ProviderType,
                                        ctx: HandlerContext): Promise<string> {
    const provider = await ctx.graphClient.query<ScmProviderByType.Query, ScmProviderByType.Variables>({
        name: "ScmProviderByType",
        variables: {
            providerType,
        },
    });

    return _.get(provider, "SCMProvider[0].credential.secret");
}

async function fetchTokenByGitHubAppName(owner: string,
                                         ctx: HandlerContext): Promise<string> {
    const app = await ctx.graphClient.query<GitHubAppInstallationByOwner.Query, GitHubAppInstallationByOwner.Variables>({
        name: "GitHubAppInstallationByOwner",
        variables: {
            name: owner,
        },
    });

    return _.get(app, "GitHubAppInstallation[0].token.secret");
}
