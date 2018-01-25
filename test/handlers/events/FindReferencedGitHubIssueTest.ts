/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";
import * as assert from "power-assert";

import { LoggingConfig } from "@atomist/automation-client/internal/util/logger";
import { MessageOptions } from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages/SlackMessages";
import { FindReferencedGitHubIssue } from "../../../src/handlers/events/FindReferencedGitHubIssue";

LoggingConfig.format = "cli";

describe("FindReferencedGitHubIssue", () => {

    const findIssue = new FindReferencedGitHubIssue();

    it("should find referenced issue", done => {
        const mockMessageClient = {
            addressChannels(msg: string | SlackMessage,
                            channelNames: string | string[],
                            options?: MessageOptions): Promise<any> {
                assert.deepEqual(channelNames, ["general"]);
                assert(msg === "You crushed #433 with commit `atomist-blogs/event-handler@sfs24wf`");
                return Promise.resolve();
            },
        };

        const ctx: any = {
            messageClient: mockMessageClient,
        };

        const payload: any = {
            data: {
                Commit: [{
                    sha: "sfs24wfhasghajae",
                    message: "With this commit I really crushed #433, don't you think?",
                    repo: {
                        owner: "atomist-blogs",
                        name: "event-handler",
                        channels: [{
                            name: "general",
                        }],
                    },
                },
                ],
            },
        };

        findIssue.handle(payload, ctx)
            .then(result => {
                assert(result.code === 0);
                done();
            });
    });

    it("shouldn't find referenced issue and not send any message", done => {
        const mockMessageClient = {
            addressChannels(msg: string | SlackMessage,
                            channelNames: string | string[],
                            options?: MessageOptions): Promise<any> {
                assert.fail("Shouldn't get called");
                return Promise.resolve();
            },
        };

        const ctx: any = {
            messageClient: mockMessageClient,
        };

        const payload: any = {
            data: {
                Commit: [{
                    sha: "sfs24wfhasghajae",
                    message: "With this commit I really didn't crush anything",
                    repo: {
                        owner: "atomist-blogs",
                        name: "event-handler",
                        channels: [{
                            name: "general",
                        }],
                    },
                },
                ],
            },
        };

        findIssue.handle(payload, ctx)
            .then(result => {
                assert(result.code === 0);
                done();
            });
    });

});
