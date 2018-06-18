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
    automationClientInstance,
    logger,
    Secrets,
} from "@atomist/automation-client";
import { configurationValue } from "@atomist/automation-client/configuration";
import { ApolloGraphClient } from "@atomist/automation-client/graph/ApolloGraphClient";
import {
    EventIncoming,
    RequestProcessor,
} from "@atomist/automation-client/internal/transport/RequestProcessor";
import { RegistrationConfirmation } from "@atomist/automation-client/internal/transport/websocket/WebSocketRequestProcessor";
import { guid } from "@atomist/automation-client/internal/util/string";
import { AutomationEventListenerSupport } from "@atomist/automation-client/server/AutomationEventListener";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import * as cluster from "cluster";
import { SdmGoalImplementationMapper } from "../../../../api/goal/support/SdmGoalImplementationMapper";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { ProgressLogFactory } from "../../../../spi/log/ProgressLog";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import { SdmGoalById } from "../../../../typings/types";
import { FulfillGoalOnRequested } from "./FulfillGoalOnRequested";

export class GoalAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly implementationMapper: SdmGoalImplementationMapper,
                private readonly projectLoader: ProjectLoader,
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentailsResolver: CredentialsResolver,
                private readonly logFactory: ProgressLogFactory) {
        super();
    }

    public eventIncoming(payload: EventIncoming) {
        if (cluster.isWorker) {
            // Register event handler locally only
            const maker = () => new FulfillGoalOnRequested(
                this.implementationMapper,
                this.projectLoader,
                this.repoRefResolver,
                this.credentailsResolver,
                this.logFactory);
            automationClientInstance().withEventHandler(maker);
        }
    }

    public async registrationSuccessful(eventHandler: RequestProcessor) {
        if (cluster.isMaster) {
            const registration = (eventHandler as any).registration as RegistrationConfirmation;
            const teamId = process.env.ATOMIST_GOAL_TEAM;
            const teamName = process.env.ATOMIST_GOAL_TEAM_NAME || teamId;
            const goalId = process.env.ATOMIST_GOAL_ID;
            const correlationId = process.env.ATOMIST_CORRELATION_ID || guid();

            // Obtain goal via graphql query
            const graphClient = new ApolloGraphClient(
                `https://automation.atomist.com/graphql/team/${teamId}`,
                { Authorization: `Bearer ${registration.jwt}` });

            const goal = await graphClient.query<SdmGoalById.Query, SdmGoalById.Variables>({
                name: "SdmGoalById",
                variables: {
                    id: goalId,
                },
                options: QueryNoCacheOptions,
            });

            // Register event handler locally only
            const maker = () => new FulfillGoalOnRequested(
                this.implementationMapper,
                this.projectLoader,
                this.repoRefResolver,
                this.credentailsResolver,
                this.logFactory);
            automationClientInstance().withEventHandler(maker);

            // Create event and run event handler
            const event: EventIncoming = {
                data: goal,
                extensions: {
                    correlation_id: correlationId,
                    team_id: teamId,
                    team_name: teamName,
                    operationName: maker().subscriptionName,
                },
                secrets: [{
                    uri: Secrets.OrgToken,
                    value: configurationValue<string>("token"),
                }],
            };
            await eventHandler.processEvent(event, async results => {
                const resolved = await results;
                logger.info("Processing goal completed with results %j", resolved);
                setTimeout(() => process.exit(0), 10000);
            });
        }
    }
}
