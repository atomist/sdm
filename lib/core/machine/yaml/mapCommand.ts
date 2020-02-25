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

import {
    MappedParameters,
    Secrets,
} from "@atomist/automation-client/lib/decorators";
import { Failure } from "@atomist/automation-client/lib/HandlerResult";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import {
    populateParameters,
    populateValues,
} from "@atomist/automation-client/lib/internal/parameterPopulation";
import { CommandIncoming } from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import { toFactory } from "@atomist/automation-client/lib/util/constructionUtils";
import { url } from "@atomist/slack-messages";
import * as _ from "lodash";
import {
    commandHandlerRegistrationToCommand,
    CommandListenerExecutionInterruptError,
} from "../../../api-helper/machine/handlerRegistrations";
import {
    slackErrorMessage,
    slackInfoMessage,
} from "../../../api-helper/misc/slack/messages";
import { CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { ParameterStyle } from "../../../api/registration/CommandRegistration";
import { ParametersObject } from "../../../api/registration/ParametersDefinition";
import {
    GitHubAppResourceProviderQuery,
    GitHubAppResourceProviderQueryVariables,
    OAuthToken,
    RepositoryByOwnerAndNameQuery,
    RepositoryByOwnerAndNameQueryVariables,
    RepositoryMappedChannels,
    RepositoryMappedChannelsQuery,
    RepositoryMappedChannelsQueryVariables,
    ResourceUserQuery,
    ResourceUserQueryVariables,
} from "../../../typings/types";
import {
    CreateGoals,
    DeliveryGoals,
} from "../configure";
import {
    CommandMaker,
    YamlCommandHandlerRegistration,
} from "./configureYaml";
import Repos = RepositoryMappedChannels.Repos;

export function decorateSoftwareDeliveryMachine<G extends DeliveryGoals>(sdm: SoftwareDeliveryMachine & { createGoals: CreateGoals<G> })
    : SoftwareDeliveryMachine & { createGoals: CreateGoals<G> } {
    const proxy = new Proxy<SoftwareDeliveryMachine & { createGoals: CreateGoals<G> }>(sdm, {
        get: (target, propKey) => {
            if (propKey === "addCommand") {
                return (...args) => {
                    const cmd = args[0] as CommandHandlerRegistration;
                    target[propKey]({
                        name: cmd.name,
                        ...mapCommand(cmd)(sdm) as YamlCommandHandlerRegistration,
                    });
                };
            } else {
                return target[propKey];
            }
        },
    });
    return proxy;
}

export function mapCommand(chr: CommandHandlerRegistration): CommandMaker {
    return sdm => {
        const ch = commandHandlerRegistrationToCommand(sdm, chr);
        const metadata = metadataFromInstance(toFactory(ch)()) as CommandHandlerMetadata;
        const parameterNames = metadata.parameters.filter(p => p.displayable === undefined || !!p.displayable).map(p => p.name);
        const mappedParameterNames = metadata.mapped_parameters.map(p => p.name);
        const allParameters = [...parameterNames, ...mappedParameterNames];

        const mapIntent = (intents: string[]) => {
            if (!!intents && intents.length > 0) {
                if (parameterNames.length > 0) {
                    return `^(?:${intents.map(i => i.replace(/ /g, "\\s+")).join("|")})(?:\\s+--(?:${allParameters.join("|")})=(?:'[^']*?'|"[^"]*?"|[\\w-]*?))*$`;
                } else {
                    return `^(?:${intents.map(i => i.replace(/ /g, "\\s+")).join("|")})$`;
                }
            } else {
                return undefined;
            }
        };

        return {

            name: metadata.name,
            description: metadata.description,
            intent: mapIntent(metadata.intent || []),
            tags: (metadata.tags || []).map(t => t.name),

            listener: async ci => {
                const instance = toFactory(ch)();
                const parametersInstance = instance.freshParametersInstance();
                const parameterDefinition: ParametersObject<any> = {};

                const intent = ((ci.context as any).trigger).raw_message;
                if (!!intent) {
                    const args = require("yargs-parser")(intent, { configuration: { "dot-notation": false } });
                    ((ci.context as any).trigger as CommandIncoming).parameters.push(..._.map(args, (v, k) => ({
                        name: k,
                        value: v,
                    })));
                }

                metadata.parameters.forEach(p => {
                    parameterDefinition[p.name] = {
                        ...p,
                        pattern: !!p.pattern ? new RegExp(p.pattern) : undefined,
                    };
                });

                const parameters = await ci.promptFor(parameterDefinition, {
                    autoSubmit: metadata.auto_submit,
                    parameterStyle: ParameterStyle.Dialog[metadata.question],
                });
                populateParameters(parametersInstance, metadata, _.map(parameters, (v, k) => ({
                    name: k,
                    value: v as any,
                })));
                populateValues(parametersInstance, metadata, ci.configuration);
                await populateSecrets(parametersInstance, metadata, ci);
                const missing = await populateMappedParameters(parametersInstance, metadata, ci);
                if (missing.length > 0) {
                    await ci.addressChannels(slackErrorMessage("Missing Mapped Parameters", missing.join("\n"), ci.context));
                    return Failure;
                }
                return instance.handle(ci.context, parametersInstance);
            },
        };
    };
}

async function populateSecrets(parameters: any, metadata: CommandHandlerMetadata, ci: CommandListenerInvocation): Promise<void> {
    for (const secret of (metadata.secrets || [])) {
        if (secret.uri.startsWith(Secrets.UserToken)) {
            const chatId = _.get(ci, "context.trigger.source.slack.user.id");
            if (!!chatId) {
                const resourceUser = await ci.context.graphClient.query<ResourceUserQuery, ResourceUserQueryVariables>({
                    name: "ResourceUser",
                    variables: {
                        id: chatId,
                    },
                });
                const credential: OAuthToken = _.get(resourceUser, "ChatId[0].person.gitHubId.credential");
                if (!!credential) {
                    const s = credential.secret;
                    _.update(parameters, secret.name, () => s);
                } else {
                    // Query GitHubAppResourceProvider to get the resource provider id
                    const provider = await ci.context.graphClient.query<GitHubAppResourceProviderQuery, GitHubAppResourceProviderQueryVariables>({
                        name: "GitHubAppResourceProvider",
                    });
                    if (!!provider?.GitHubAppResourceProvider[0]?.providerId) {
                        // Send message when there is a GitHubAppResourceProvider
                        const orgUrl = `https://api.atomist.com/v2/auth/teams/${ci.context.workspaceId}/resource-providers/${provider.GitHubAppResourceProvider[0].providerId}/token?state=${guid()}&redirect-uri=https://www.atomist.com/success.html`;
                        await ci.addressChannels(
                            slackInfoMessage(
                                "Link GitHub Account",
                                `In order to run this command Atomist needs to link your GitHub identity to your Slack user.\n\nPlease ${url(orgUrl, "click here")} to link your account.`));
                        throw new CommandListenerExecutionInterruptError("Sending token collection message");
                    }
                }
            }
        } else if (secret.uri === Secrets.OrgToken) {
            // TODO cd add this
        }
    }
}

async function populateMappedParameters(parameters: any, metadata: CommandHandlerMetadata, ci: CommandListenerInvocation): Promise<string[]> {
    const missing = [];
    for (const mp of (metadata.mapped_parameters || [])) {
        const value = ((ci.context as any).trigger as CommandIncoming).parameters.find(p => p.name === mp.name);
        if (value !== undefined) {
            _.update(parameters, mp.name, () => value.value);
        } else {
            switch (mp.uri) {
                case MappedParameters.GitHubOwner:
                case MappedParameters.GitHubOwnerWithUser:
                    const ownerDetails = await loadRepositoryDetailsFromChannel(ci, metadata);
                    _.update(parameters, mp.name, () => ownerDetails.owner);
                    break;
                case MappedParameters.GitHubRepository:
                case MappedParameters.GitHubAllRepositories:
                    const repoDetails = await loadRepositoryDetailsFromChannel(ci, metadata);
                    _.update(parameters, mp.name, () => repoDetails.name);
                    break;
                case MappedParameters.GitHubApiUrl:
                    const apiUrlDetails = await loadRepositoryDetailsFromChannel(ci, metadata);
                    _.update(parameters, mp.name, () => apiUrlDetails.apiUrl);
                    break;
                case MappedParameters.GitHubRepositoryProvider:
                    const providerIdDetails = await loadRepositoryDetailsFromChannel(ci, metadata);
                    _.update(parameters, mp.name, () => providerIdDetails.providerId);
                    break;
                case MappedParameters.GitHubUrl:
                    const urlDetails = await loadRepositoryDetailsFromChannel(ci, metadata);
                    _.update(parameters, mp.name, () => urlDetails.url);
                    break;

                case MappedParameters.GitHubUserLogin:
                    const chatId = _.get(ci, "context.trigger.source.slack.user.id");
                    const resourceUser = await ci.context.graphClient.query<ResourceUserQuery, ResourceUserQueryVariables>({
                        name: "ResourceUser",
                        variables: {
                            id: chatId,
                        },
                    });
                    _.update(parameters, mp.name, () => _.get(resourceUser, "ChatId[0].person.gitHubId.login"));
                    break;
                case MappedParameters.SlackChannel:
                    _.update(parameters, mp.name, () => _.get(ci, "context.trigger.source.slack.channel.id"));
                    break;
                case MappedParameters.SlackChannelName:
                    _.update(parameters, mp.name, () => _.get(ci, "context.trigger.source.slack.channel.name"));
                    break;
                case MappedParameters.SlackUser:
                    _.update(parameters, mp.name, () => _.get(ci, "context.trigger.source.slack.user.id"));
                    break;
                case MappedParameters.SlackUserName:
                    _.update(parameters, mp.name, () => _.get(ci, "context.trigger.source.slack.user.name"));
                    break;
                case MappedParameters.SlackTeam:
                    _.update(parameters, mp.name, () => _.get(ci, "context.trigger.source.slack.team.id"));
                    break;
            }
        }

        if (parameters[mp.name] === undefined && mp.required === true) {
            missing.push(`Required mapped parameter '${mp.name}' missing`);
        }
    }
    return missing;
}

async function loadRepositoryDetailsFromChannel(ci: CommandListenerInvocation,
                                                metadata: CommandHandlerMetadata)
    : Promise<{ name?: string, owner?: string, providerId?: string, providerType?: string, apiUrl?: string, url?: string }> {

    // If owner and repo was provided, find the remaining mapped parameters from that
    const incomingParameters = ((ci.context as any).trigger as CommandIncoming).parameters;
    const ownerMp = metadata.mapped_parameters.find(mp => mp.uri === MappedParameters.GitHubOwner);
    const repoMp = metadata.mapped_parameters.find(mp => mp.uri === MappedParameters.GitHubRepository);
    const ownerParameter = !!ownerMp ? incomingParameters.find(p => p.name === ownerMp.name) : undefined;
    const repoParameter = !!repoMp ? incomingParameters.find(p => p.name === repoMp?.name) : undefined;
    if (!!ownerMp && !!repoMp && !!ownerParameter && !!repoParameter) {
        const repo = await ci.context.graphClient.query<RepositoryByOwnerAndNameQuery, RepositoryByOwnerAndNameQueryVariables>({
            name: "RepositoryByOwnerAndName",
            variables: {
                owner: ownerParameter.value,
                name: repoParameter.value,
            },
        });
        if (repo?.Repo?.length === 1) {
            return {
                name: repo?.Repo[0]?.name,
                owner: repo?.Repo[0]?.owner,
                providerId: repo?.Repo[0]?.org.provider.providerId,
                providerType: repo?.Repo[0]?.org.provider.providerType,
                apiUrl: repo?.Repo[0]?.org.provider.apiUrl,
                url: repo?.Repo[0]?.org.provider.url,
            };
        }
    }

    // Check if we want a list of repositories
    if (metadata.mapped_parameters.some(mp => mp.uri === MappedParameters.GitHubAllRepositories
        || mp.uri === MappedParameters.GitHubOwnerWithUser)) {
        const parameters = await ci.promptFor<{ repo_slug: string }>({
            repo_slug: {
                description: "Slug of repository",
                displayName: "Repository (owner/repository)",
            },
        }, {});
        const repo = await ci.context.graphClient.query<RepositoryByOwnerAndNameQuery, RepositoryByOwnerAndNameQueryVariables>({
            name: "RepositoryByOwnerAndName",
            variables: {
                owner: parameters.repo_slug.split("/")[0],
                name: parameters.repo_slug.split("/")[1],
            },
        });
        return {
            name: repo?.Repo[0]?.name,
            owner: repo?.Repo[0]?.owner,
            providerId: repo?.Repo[0]?.org.provider.providerId,
            providerType: repo?.Repo[0]?.org.provider.providerType,
            apiUrl: repo?.Repo[0]?.org.provider.apiUrl,
            url: repo?.Repo[0]?.org.provider.url,
        };
    } else {
        const channelId = _.get(ci, "context.trigger.source.slack.channel.id");
        const channels = await ci.context.graphClient.query<RepositoryMappedChannelsQuery, RepositoryMappedChannelsQueryVariables>({
            name: "RepositoryMappedChannels",
            variables: {
                id: channelId,
            },
        });
        const repos: Repos[] = _.get(channels, "ChatChannel[0].repos") || [];
        if (!!repos) {
            if (repos.length === 1) {
                return {
                    name: repos[0].name,
                    owner: repos[0].owner,
                    providerId: repos[0].org.provider.providerId,
                    providerType: repos[0].org.provider.providerType,
                    apiUrl: repos[0].org.provider.apiUrl,
                    url: repos[0].org.provider.url,
                };
            } else if (repos.length > 0) {
                const parameters = await ci.promptFor<{ repo_id: string }>({
                    repo_id: {
                        displayName: "Repository",
                        type: {
                            kind: "single",
                            options: repos.map(r => ({ description: `${r.owner}/${r.name}`, value: r.id })),
                        },
                    },
                }, {});
                const repo = repos.find(r => r.id === parameters.repo_id);
                return {
                    name: repo.name,
                    owner: repo.owner,
                    providerId: repo.org.provider.providerId,
                    providerType: repo.org.provider.providerType,
                    apiUrl: repo.org.provider.apiUrl,
                    url: repo.org.provider.url,
                };
            } else {
                const parameters = await ci.promptFor<{ repo_slug: string }>({
                    repo_slug: {
                        displayName: "Repository (owner/repository)",
                        description: "Slug of repository",
                    },
                }, {});
                const repo = await ci.context.graphClient.query<RepositoryByOwnerAndNameQuery, RepositoryByOwnerAndNameQueryVariables>({
                    name: "RepositoryByOwnerAndName",
                    variables: {
                        owner: parameters.repo_slug.split("/")[0],
                        name: parameters.repo_slug.split("/")[1],
                    },
                });
                return {
                    name: repo?.Repo[0]?.name,
                    owner: repo?.Repo[0]?.owner,
                    providerId: repo?.Repo[0]?.org.provider.providerId,
                    providerType: repo?.Repo[0]?.org.provider.providerType,
                    apiUrl: repo?.Repo[0]?.org.provider.apiUrl,
                    url: repo?.Repo[0]?.org.provider.url,
                };
            }
        }
    }
    return {};
}
