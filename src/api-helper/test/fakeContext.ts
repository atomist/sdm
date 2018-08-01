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

import { AutomationContextAware, HandlerContext } from "@atomist/automation-client";
import { CommandIncoming } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { Destination, MessageClient, MessageOptions, SlackMessageClient } from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";

/**
 * Convenient function to allow creating fake contexts.
 * Useful for testing
 * @param {string} teamId
 * @return {any}
 */
export function fakeContext(teamId: string = "T123"): HandlerContext & AutomationContextAware {
    const correlationId = "foo";
    return {
        teamId,
        workspaceId: teamId,
        messageClient: new DevNullMessageClient(),
        correlationId,
        context: {
            name: "test-context",
            teamId,
            workspaceId: teamId,
            workspaceName: teamId,
            teamName: teamId,
            operation: "operation",
            version: "0.1.0",
            invocationId: "inv-id",
            ts: new Date().getTime(),
            correlationId,
            messageClient: new DevNullMessageClient(),
        },
        trigger: {} as CommandIncoming,
    };
}

class DevNullMessageClient implements MessageClient, SlackMessageClient {

    public async addressChannels(msg: string | SlackMessage, channels: string | string[], options?: MessageOptions): Promise<any> {
        return {};
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        return {};
    }

    public async respond(msg: any, options?: MessageOptions): Promise<any> {
        return {};
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        return {};
    }

}
