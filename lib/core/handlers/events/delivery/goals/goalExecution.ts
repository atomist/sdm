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

import { AutomationClient } from "@atomist/automation-client/lib/automationClient";
import { Configuration } from "@atomist/automation-client/lib/configuration";
import { Secrets } from "@atomist/automation-client/lib/decorators";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import {
    isCommandHandlerMetadata,
    isEventHandlerMetadata,
} from "@atomist/automation-client/lib/internal/metadata/metadata";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { AbstractRequestProcessor } from "@atomist/automation-client/lib/internal/transport/AbstractRequestProcessor";
import {
    CommandIncoming,
    EventIncoming,
    workspaceId,
} from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import { safeExit } from "@atomist/automation-client/lib/internal/util/shutdown";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { AutomationMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import {
    AutomationEventListener,
    AutomationEventListenerSupport,
} from "@atomist/automation-client/lib/server/AutomationEventListener";
import { AutomationServer } from "@atomist/automation-client/lib/server/AutomationServer";
import { AutomationMetadataProcessor } from "@atomist/automation-client/lib/spi/env/MetadataProcessor";
import {
    GraphClient,
    QueryNoCacheOptions,
} from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { GraphClientFactory } from "@atomist/automation-client/lib/spi/graph/GraphClientFactory";
import {
    Destination,
    MessageClient,
    MessageOptions,
} from "@atomist/automation-client/lib/spi/message/MessageClient";
import {
    Maker,
    toFactory,
} from "@atomist/automation-client/lib/util/constructionUtils";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import * as _ from "lodash";
import { SoftwareDeliveryMachine } from "../../../../../api/machine/SoftwareDeliveryMachine";
import { SdmGoalsByGoalSetIdAndUniqueName } from "../../../../../typings/types";
import { FulfillGoalOnRequested } from "./FulfillGoalOnRequested";

export class GoalExecutionAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly sdm: SoftwareDeliveryMachine) {
        super();
    }

    public async startupSuccessful(client: AutomationClient): Promise<void> {
        if (cluster.isMaster) {
            const teamId = process.env.ATOMIST_GOAL_TEAM;
            const teamName = process.env.ATOMIST_GOAL_TEAM_NAME || teamId;
            const goalSetId = [process.env.ATOMIST_GOAL_SET_ID];
            const uniqueName = [process.env.ATOMIST_GOAL_UNIQUE_NAME];
            const correlationId = process.env.ATOMIST_CORRELATION_ID || guid();

            // Obtain goal via graphql query
            const agc = await import("@atomist/automation-client/lib/graph/ApolloGraphClient");
            const graphClient = new agc.ApolloGraphClient(
                `${this.sdm.configuration.endpoints.graphql}/${teamId}`,
                { Authorization: `Bearer ${client.configuration.apiKey}` });

            const goal = await graphClient.query<SdmGoalsByGoalSetIdAndUniqueName.Query, SdmGoalsByGoalSetIdAndUniqueName.Variables>({
                name: "SdmGoalsByGoalSetIdAndUniqueName",
                variables: {
                    goalSetId,
                    uniqueName,
                },
                options: QueryNoCacheOptions,
            });

            // Create event and run event handler
            const event: EventIncoming = {
                data: _.cloneDeep(goal),
                extensions: {
                    correlation_id: correlationId,
                    team_id: teamId,
                    team_name: teamName,
                    operationName: metadataFromInstance(new FulfillGoalOnRequested(
                        this.sdm.goalFulfillmentMapper,
                        [...this.sdm.goalExecutionListeners])).name,
                },
                secrets: [{
                    uri: Secrets.OrgToken,
                    value: "null",
                }],
            };
            try {
                await new Promise<void>((resolve, reject) => {
                    client.processEvent(event, pResults => {
                        pResults.then(results => {
                            logger.debug("Processing goal completed with results %j", results);
                            resolve();
                        }, reject);
                    });
                });
            } catch (e) {
                logger.error(`Processing goal failed: ${e.message}`);
            }
            // Exit successfully to avoid job schedulers retrying.
            safeExit(0);
        }
    }
}

export class FilteringMetadataProcessor implements AutomationMetadataProcessor {

    private readonly allowedCommands: string[];
    private readonly allowedEvents: string[];

    constructor(allowedCommandHandlers: Array<Maker<HandleCommand<any>>>,
                allowedEventHandlers: Array<Maker<HandleEvent<any>>>) {
        this.allowedCommands = allowedCommandHandlers.map(h => metadataFromInstance(toFactory(h)()).name);
        this.allowedEvents = allowedEventHandlers.map(h => metadataFromInstance(toFactory(h)()).name);
    }

    public process<T extends AutomationMetadata>(metadata: T): T {
        if (isEventHandlerMetadata(metadata) && !this.allowedEvents.includes(metadata.name)) {
            metadata.expose = false;
        } else if (isCommandHandlerMetadata(metadata) && !this.allowedCommands.includes(metadata.name)) {
            metadata.expose = false;
        }
        return metadata;
    }
}

export class GoalExecutionRequestProcessor extends AbstractRequestProcessor {

    private readonly graphClients: GraphClientFactory;

    constructor(protected automations: AutomationServer,
                protected configuration: Configuration,
                protected listeners: AutomationEventListener[] = []) {
        super(automations, configuration, listeners);
        this.graphClients = configuration.graphql.client.factory;
    }

    protected createGraphClient(event: CommandIncoming | EventIncoming): GraphClient {
        return this.graphClients.create(
            workspaceId(event),
            this.configuration);
    }

    protected createMessageClient(event: EventIncoming | CommandIncoming, context: AutomationContextAware): MessageClient {
        return new NoOpMessageClient();
    }

    protected async sendStatusMessage(payload: any, ctx: HandlerContext & AutomationContextAware): Promise<any> {
        // Intentionally left empty
    }
}

class NoOpMessageClient implements MessageClient {

    public async delete(destinations: Destination | Destination[], options: Pick<MessageOptions, "id" | "thread"> & { id: string }): Promise<void> {
        logger.debug(`Ignoring delete message '${JSON.stringify(options)}'`);
    }

    public async respond(msg: any, options?: MessageOptions): Promise<any> {
        logger.debug(`Ignoring respond message '${JSON.stringify(msg)}'`);
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        logger.debug(`Ignoring send message '${JSON.stringify(msg)}'`);
    }
}
