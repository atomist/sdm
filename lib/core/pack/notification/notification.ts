/*
 * Copyright © 2019 Atomist, Inc.
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

import { guid } from "@atomist/automation-client/lib/internal/util/string";
import {
    addressSlackUsers,
    Destination,
    MessageOptions,
} from "@atomist/automation-client/lib/spi/message/MessageClient";
import {
    bold,
    channel,
    codeLine,
    escape,
    italic,
    SlackMessage,
    url,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { metadata } from "../../../api-helper/misc/extensionPack";
import {
    slackErrorMessage,
    slackFooter,
    slackInfoMessage,
} from "../../../api-helper/misc/slack/messages";
import { actionableButton } from "../../../api/command/support/buttons";
import { SdmContext } from "../../../api/context/SdmContext";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import {
    GoalCompletionListener,
    GoalCompletionListenerInvocation,
} from "../../../api/listener/GoalCompletionListener";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import {
    CoreRepoFieldsAndChannels,
    SdmGoalState,
} from "../../../typings/types";
import { toArray } from "../../util/misc/array";
import { updateGoalStateCommand } from "../goal-state/updateGoal";

/**
 * Factory to create message destinations for goal notifications
 */
export type DestinationFactory = (goal: SdmGoalEvent, context: SdmContext) => Promise<Destination | Destination[] | undefined>;

/**
 * Factory to create notification messages
 */
export type NotificationFactory = (gi: GoalCompletionListenerInvocation) => Promise<{ message: any, options: MessageOptions }>;

/**
 * Options to configure the notification support
 */
export interface NotificationOptions {
    destination?: DestinationFactory | DestinationFactory[];
    notification?: NotificationFactory;
}

/**
 * Extension pack to send notifications on certain conditions.
 * Recipients and notification messages can be customized by providing options
 * with DestinationFactory and NotificationFactory.
 * @param options
 */
export function notificationSupport(options: NotificationOptions = {}): ExtensionPack {
    return {
        ...metadata("notification"),
        configure: sdm => {

            const updateGoalCommand = updateGoalStateCommand();
            updateGoalCommand.name = `${updateGoalCommand.name}ForNotifications`;
            sdm.addCommand(updateGoalCommand);

            const optsToUse: NotificationOptions = {
                destination: defaultDestinationFactory,
                notification: defaultNotificationFactory(updateGoalCommand),
                ...options,
            };

            sdm.addGoalCompletionListener(notifyGoalCompletionListener(optsToUse));
        },
    };
}

/**
 * Default DestinationFactory that would send every commit author a direct message in Slack / MS Teams.
 */
export async function defaultDestinationFactory(goal: SdmGoalEvent): Promise<Destination | Destination[] | undefined> {
    if (goal.state === SdmGoalState.failure) {

        return _.uniqBy(goal.push.commits.map(c => _.get(c, "author.person.chatId"))
            .filter(c => !!c), r => `${r.chatTeam.id}.${r.screenName}`)
            .map(r => addressSlackUsers(r.chatTeam.id, r.screenName));

    }

    return undefined;
}

/**
 * Default NotificationFactory that sends messages with restart, start and approve buttons where appropriate.
 */
export function defaultNotificationFactory(updateGoalCommand: CommandHandlerRegistration<any>): NotificationFactory {
    return async gi => {
        const { completedGoal, context } = gi;
        const goalSetId = completedGoal.goalSetId;
        const uniqueName = completedGoal.uniqueName;
        const msgId = guid();

        let state: string;
        let suffix: string;
        let msg: SlackMessage;
        switch (completedGoal.state) {
            case SdmGoalState.failure:
                state = "has failed";
                suffix = "Failed";
                msg = slackErrorMessage("", "", context, {
                    actions: completedGoal.retryFeasible ? [
                        actionableButton({ text: "Restart" }, updateGoalCommand, {
                            goalSetId,
                            uniqueName,
                            msgId,
                            state: SdmGoalState.requested,
                        })] : [],
                });
                break;
            case SdmGoalState.waiting_for_approval:
                state = "is waiting for approval";
                suffix = "Awaiting Approval";
                msg = slackInfoMessage("", "", {
                    actions: [actionableButton({ text: "Approve" }, updateGoalCommand, {
                        goalSetId,
                        uniqueName,
                        msgId,
                        state: SdmGoalState.approved,
                    })],
                });
                break;
            case SdmGoalState.waiting_for_pre_approval:
                state = "is waiting to start";
                suffix = "Awaiting Start";
                msg = slackInfoMessage("", "", {
                    actions: [actionableButton({ text: "Start" }, updateGoalCommand, {
                        goalSetId,
                        uniqueName,
                        msgId,
                        state: SdmGoalState.pre_approved,
                    })],
                });
                break;
            case SdmGoalState.stopped:
                state = "has stopped";
                suffix = "Stopped";
                msg = slackInfoMessage("", "");
                break;
            default:
                return undefined;
        }

        const author = `Goal ${suffix}`;
        const commitMsg = truncateCommitMessage(completedGoal.push.after.message);
        const text = `Goal ${italic(completedGoal.url ? url(completedGoal.url, completedGoal.name) : completedGoal.name)} on ${
            url(completedGoal.push.after.url, codeLine(completedGoal.sha.slice(0, 7)))} ${italic(commitMsg)} of ${
            bold(`${url(completedGoal.push.repo.url, `${completedGoal.repo.owner}/${completedGoal.repo.name}/${
                completedGoal.branch}`)}`)} ${state}.`;
        const channels: CoreRepoFieldsAndChannels.Channels[] = _.get(completedGoal, "push.repo.channels") || [];
        const channelLink = channels.filter(c => !!c.channelId).map(c => channel(c.channelId)).join(" \u00B7 ");
        const link =
            `https://app.atomist.com/workspace/${context.workspaceId}/goalset/${completedGoal.goalSetId}`;

        msg.attachments[0] = {
            ...msg.attachments[0],
            author_name: author,
            text,
            footer: `${slackFooter()} \u00B7 ${url(link, completedGoal.goalSetId.slice(0, 7))} \u00B7 ${channelLink}`,
        };

        return { message: msg, options: { id: msgId } };
    };
}

/**
 * GoalCompletionListener that delegates to the NotificationFactory and DestinationFactory to
 * create notifications and send them out.
 */
export function notifyGoalCompletionListener(options: NotificationOptions): GoalCompletionListener {
    return async gi => {
        const { completedGoal, context } = gi;

        const destinations: Destination[] = [];

        for (const destinationFactory of toArray(options.destination || [])) {
            const newDestinations = await destinationFactory(completedGoal, gi);
            if (!!newDestinations) {
                destinations.push(...toArray(newDestinations));
            }
        }

        if (destinations.length > 0) {
            const msg = await options.notification(gi);
            for (const destination of destinations) {
                await context.messageClient.send(msg.message, destination, msg.options);
            }
        }
    };
}

export function truncateCommitMessage(message: string): string {
    const title = (message || "").split("\n")[0];
    const escapedTitle = escape(title);

    if (escapedTitle.length <= 50) {
        return escapedTitle;
    }

    const splitRegExp = /(&(?:[gl]t|amp);|<.*?\||>)/;
    const titleParts = escapedTitle.split(splitRegExp);
    let truncatedTitle = "";
    let addNext = 1;
    let i;
    for (i = 0; i < titleParts.length; i++) {
        let newTitle = truncatedTitle;
        if (i % 2 === 0) {
            newTitle += titleParts[i];
        } else if (/^&(?:[gl]t|amp);$/.test(titleParts[i])) {
            newTitle += "&";
        } else if (/^<.*\|$/.test(titleParts[i])) {
            addNext = 2;
            continue;
        } else if (titleParts[i] === ">") {
            addNext = 1;
            continue;
        }
        if (newTitle.length > 50) {
            const l = 50 - newTitle.length;
            titleParts[i] = titleParts[i].slice(0, l) + "...";
            break;
        }
        truncatedTitle = newTitle;
    }
    return titleParts.slice(0, i + addNext).join("");
}
