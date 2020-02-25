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
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { buttonForCommand } from "@atomist/automation-client/lib/spi/message/MessageClient";
import {
    Action,
    Attachment,
    bold,
    codeLine,
    italic,
    SlackMessage,
} from "@atomist/slack-messages";
import { fetchGoalsForCommit } from "../../../api-helper/goal/fetchGoalsOnCommit";
import {
    storeGoalSet,
    updateGoal,
} from "../../../api-helper/goal/storeGoals";
import {
    slackFooter,
    slackInfoMessage,
    slackSuccessMessage,
    slackTs,
} from "../../../api-helper/misc/slack/messages";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import {
    InProcessSdmGoalSets,
    SdmGoalSetForId,
    SdmGoalState,
} from "../../../typings/types";

/**
 * List all pending goal sets and allow to cancel
 * @param sdm
 */
export function listPendingGoalSetsCommand(sdm: SoftwareDeliveryMachine): CommandHandlerRegistration<{ msgId: string }> {
    return {
        name: "ListGoalSets",
        description: "List pending goal sets",
        parameters: {
            msgId: { required: false, displayable: false },
        },
        intent: `list goal sets ${sdm.configuration.name.replace("@", "")}`,
        listener: async ci => {
            const id = ci.parameters.msgId || guid();
            let offset = 0;
            let pgs = await pendingGoalSets(ci.context, sdm.configuration.name, offset);
            const attachments: Attachment[] = [];
            while (pgs.length > 0) {
                for (const pg of pgs) {
                    attachments.push({
                        text: `Pending goal set ${italic(pg.goalSet)} ${codeLine(pg.goalSetId.slice(0, 7))} on ${
                            codeLine(pg.sha.slice(0, 7))} of ${bold(`${pg.repo.owner}/${pg.repo.name}/${pg.branch}`)} is ${italic(pg.state)}`,
                        fallback: pg.goalSet,
                        actions: [
                            buttonForCommand({ text: "Cancel" }, cancelGoalSetsCommand(sdm).name, {
                                goalSetId: pg.goalSetId,
                                msgId: id,
                            }),
                        ],
                    });
                }
                offset = offset + pgs.length;
                pgs = await pendingGoalSets(ci.context, sdm.configuration.name, offset);
            }

            const update: Action = buttonForCommand(
                { text: "Refresh" },
                "ListGoalSets",
                { msgId: id });

            let msg: SlackMessage;
            if (attachments.length > 0) {
                msg = slackInfoMessage(
                    "Pending Goal Sets",
                    `Following ${attachments.length} goal ${attachments.length === 1 ? "set is" : "sets are"} pending:`);
                msg.attachments[0].footer = undefined;
                msg.attachments[0].ts = undefined;
                msg.attachments.push(...attachments);
            } else {
                msg = slackInfoMessage(
                    "Pending Goal Sets",
                    `No pending goal sets found`);
            }

            const lastAttachment = msg.attachments[msg.attachments.length - 1];
            lastAttachment.footer = slackFooter();
            lastAttachment.ts = slackTs();
            if (lastAttachment.actions) {
                lastAttachment.actions.push(update);
            } else {
                lastAttachment.actions = [update];
            }

            await ci.context.messageClient.respond(msg, { id });
        },
    };
}

/**
 * Cancel one or all pending goal sets
 * @param sdm
 */
export function cancelGoalSetsCommand(sdm: SoftwareDeliveryMachine): CommandHandlerRegistration<{ goalSetId: string, msgId: string }> {
    return {
        name: "CancelGoalSets",
        description: "Cancel one or all pending goal sets of this SDM",
        intent: `cancel goal sets ${sdm.configuration.name.replace("@", "")}`,
        parameters: {
            goalSetId: { required: false, description: "ID of the goal set to cancel" },
            msgId: { required: false, displayable: false },
        },
        listener: async ci => {
            const id = ci.parameters.msgId || guid();
            if (!!ci.parameters.goalSetId) {
                await cancelGoalSet(ci.parameters.goalSetId, ci.context, id);
            } else {
                let pgs = await pendingGoalSets(ci.context, sdm.configuration.name);
                let count = 0;
                while (pgs.length > 0) {
                    for (const pg of pgs) {
                        await cancelGoalSet(pg.goalSetId, ci.context);
                        count++;
                    }
                    pgs = await pendingGoalSets(ci.context, sdm.configuration.name);
                }
                await ci.context.messageClient.respond(
                    slackSuccessMessage(
                        "Cancel Goal Sets",
                        `Successfully canceled ${count} pending goal ${count > 1 ? "sets" : "set"}`));
            }
        },
    };
}

export async function pendingGoalSets(ctx: HandlerContext,
                                      name: string,
                                      offset: number = 0,
                                      fetch: number = 50): Promise<InProcessSdmGoalSets.SdmGoalSet[]> {
    const results = await ctx.graphClient.query<InProcessSdmGoalSets.Query, InProcessSdmGoalSets.Variables>({
        name: "InProcessSdmGoalSets",
        variables: {
            fetch,
            offset,
            registration: [name],
        },
        options: {
            ...QueryNoCacheOptions,
            log: configurationValue("sdm.query.logging", false),
        },
    });
    return (results.SdmGoalSet || []).map(gs => gs);
}

async function cancelGoalSet(goalSetId: string, ctx: HandlerContext, id?: string): Promise<void> {
    const result = await ctx.graphClient.query<SdmGoalSetForId.Query, SdmGoalSetForId.Variables>({
        name: "SdmGoalSetForId",
        variables: {
            goalSetId: [goalSetId],
        },
        options: QueryNoCacheOptions,
    });

    const goalSet = result.SdmGoalSet[0];

    const goals = await fetchGoalsForCommit(ctx, {
        owner: goalSet.repo.owner,
        repo: goalSet.repo.name,
        sha: goalSet.sha,
        branch: goalSet.branch,
    } as any, goalSet.repo.providerId, goalSetId);

    for (const goal of goals) {
        if (![SdmGoalState.success,
            SdmGoalState.canceled,
            SdmGoalState.stopped,
            SdmGoalState.skipped,
            SdmGoalState.failure].includes(goal.state)) {
            await updateGoal(ctx, goal, {
                state: SdmGoalState.canceled,
                description: !!goal.descriptions && !!goal.descriptions.canceled
                    ? goal.descriptions.canceled : `Canceled: ${goal.name}`,
            });
        }
    }

    if (result && result.SdmGoalSet && result.SdmGoalSet.length === 1) {
        const gs = result.SdmGoalSet[0];
        const newGoalSet: any = {
            ...gs,
            state: SdmGoalState.canceled,
        };
        await storeGoalSet(ctx, newGoalSet);
    }

    await ctx.messageClient.respond(
        slackInfoMessage(
            "Cancel Goal Set",
            `Canceled goal set ${italic(goalSet.goalSet)} ${codeLine(goalSetId.slice(0, 7))} on ${
                codeLine(goalSet.sha.slice(0, 7))} of ${bold(`${goalSet.repo.owner}/${goalSet.repo.name}/${goalSet.branch}`)}`),
        { id });
}
