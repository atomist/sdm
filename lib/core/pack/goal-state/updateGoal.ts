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

import { MappedParameters } from "@atomist/automation-client/lib/decorators";
import { AutomationContextAware } from "@atomist/automation-client/lib/HandlerContext";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import {
    bold,
    codeLine,
    italic,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { storeGoal } from "../../../api-helper/goal/storeGoals";
import {
    slackErrorMessage,
    slackSuccessMessage,
} from "../../../api-helper/misc/slack/messages";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { DeclarationType } from "../../../api/registration/ParametersDefinition";
import {
    SdmGoalFields,
    SdmGoalsByGoalSetIdAndUniqueName,
    SdmGoalState,
} from "../../../typings/types";

export interface UpdateGoalStateParameters {
    goalSetId: string;
    uniqueName: string;
    state: SdmGoalState;
    msgId: string;
    slackRequester: string;
    githubRequester: string;
    teamId: string;
    channelId: string;
}

export function updateGoalStateCommand(): CommandHandlerRegistration<UpdateGoalStateParameters> {
    return {
        name: "UpdateGoalStateCommand",
        description: "Update goal state",
        parameters: {
            goalSetId: {},
            uniqueName: {},
            state: {},
            msgId: {},
            slackRequester: {
                uri: MappedParameters.SlackUserName,
                required: false,
                declarationType: DeclarationType.Mapped,
            },
            githubRequester: {
                uri: MappedParameters.GitHubUserLogin,
                required: false,
                declarationType: DeclarationType.Mapped,
            },
            teamId: { uri: MappedParameters.SlackTeam, required: false, declarationType: DeclarationType.Mapped },
            channelId: { uri: MappedParameters.SlackChannel, required: false, declarationType: DeclarationType.Mapped },
        },
        listener: async ci => {
            const goalResult = await ci.context.graphClient.query<SdmGoalsByGoalSetIdAndUniqueName.Query,
                SdmGoalsByGoalSetIdAndUniqueName.Variables>({
                name: "SdmGoalsByGoalSetIdAndUniqueName",
                variables: {
                    goalSetId: [ci.parameters.goalSetId],
                    uniqueName: [ci.parameters.uniqueName],
                },
                options: QueryNoCacheOptions,
            });

            if (!goalResult || !goalResult.SdmGoal[0]) {
                await ci.context.messageClient.respond(
                    slackErrorMessage(`Update Goal State`, "Provided goal does not exist", ci.context));
                return Success;
            }

            const goal = _.cloneDeep(goalResult.SdmGoal[0]);
            const actx = ci.context as any as AutomationContextAware;

            const prov: SdmGoalFields.Provenance = {
                name: actx.context.operation,
                registration: actx.context.name,
                version: actx.context.version,
                correlationId: actx.context.correlationId,
                ts: Date.now(),
                channelId: ci.parameters.channelId,
                userId: ci.parameters.slackRequester ? ci.parameters.slackRequester : ci.parameters.githubRequester,
            };

            goal.provenance.push(prov);

            // Don't set approval for restart updates
            if (ci.parameters.state === SdmGoalState.approved) {
                goal.approval = prov;
                goal.approvalRequired = false;
            } else if (ci.parameters.state === SdmGoalState.pre_approved) {
                goal.preApproval = prov;
                goal.preApprovalRequired = false;
            }

            goal.state = ci.parameters.state;
            goal.ts = Date.now();
            goal.version = (goal.version || 0) + 1;
            delete (goal as any).id;

            await storeGoal(ci.context, goal as any);
            return ci.context.messageClient.respond(
                slackSuccessMessage(
                    "Set Goal State",
                    `Successfully set state of ${italic(goal.name)} on ${codeLine(goal.sha.slice(0, 7))} of ${
                        bold(`${goal.repo.owner}/${goal.repo.name}/${goal.branch}`)} to ${italic(ci.parameters.state)}`),
                { id: ci.parameters.msgId || guid()});
        },
    };
}
