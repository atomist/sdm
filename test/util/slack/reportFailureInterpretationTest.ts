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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SlackMessage } from "@atomist/slack-messages";
import * as assert from "power-assert";
import { InterpretedLog } from "../../../src";
import { AddressChannels } from "../../../src/common/slack/addressChannels";
import { reportFailureInterpretationToLinkedChannels } from "../../../src/util/slack/reportFailureInterpretationToLinkedChannels";

describe("Reporting failure interpretation", () => {

    interface AddressChannelsSpy {
        messagesSent: SlackMessage[];
        sentFullLog: boolean;
    }

    function fakeAddressChannels(): [AddressChannels, AddressChannelsSpy] {
        const spy: AddressChannelsSpy = {
            messagesSent: [],
            get sentFullLog() {
                // tslint:disable:no-invalid-this
                return !!this.messagesSent.find(m => m.fileType === "text");
            },
        };
        const ac = async (msg, opts) => {
            spy.messagesSent.push(msg);
        };

        return [ac, spy];
    }

    it("Reports the full log if requested", async () => {

        const [ac, spy] = fakeAddressChannels();

        const interpretedLog: InterpretedLog = {
            relevantPart: "busted",
            message: "Hi",
            includeFullLog: true,
        };
        const fullLog = {log: "you are so busted"};
        await reportFailureInterpretationToLinkedChannels("stepName",
            interpretedLog, fullLog, {sha: "abc"} as RemoteRepoRef, ac);

        assert(spy.sentFullLog);
    });

    it("Does not the full log if specifically unrequested", async () => {

        const [ac, spy] = fakeAddressChannels();

        const interpretedLog: InterpretedLog = {
            relevantPart: "busted",
            message: "Hi",
            includeFullLog: false,
        };
        const fullLog = {url: "here", log: "you are so busted"};
        await reportFailureInterpretationToLinkedChannels("stepName",
            interpretedLog, fullLog, {sha: "abc"} as RemoteRepoRef, ac);

        assert(!spy.sentFullLog);
    });

    it("Does not report the full log if unspecified, and the log is available at a url", async () => {

        const [ac, spy] = fakeAddressChannels();

        const interpretedLog: InterpretedLog = {
            relevantPart: "busted",
            message: "Hi",
        };
        const fullLog = {url: "here", log: "you are so busted"};
        await reportFailureInterpretationToLinkedChannels("stepName",
            interpretedLog, fullLog, {sha: "abc"} as RemoteRepoRef, ac);

        assert(!spy.sentFullLog);
    });

    it("Reports the full log if unspecified, but the log does not have a url", async () => {

        const [ac, spy] = fakeAddressChannels();

        const interpretedLog: InterpretedLog = {
            relevantPart: "busted",
            message: "Hi",
        };
        const fullLog = {log: "you are so busted"};
        await reportFailureInterpretationToLinkedChannels("stepName",
            interpretedLog, fullLog, {sha: "abc"} as RemoteRepoRef, ac);

        assert(spy.sentFullLog);
    });

});
