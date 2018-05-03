import * as assert from "power-assert";
import { AddressChannels } from "../../../src/common/slack/addressChannels";
import { SlackMessage } from "@atomist/slack-messages";
import { reportFailureInterpretationToLinkedChannels } from "../../../src/util/slack/reportFailureInterpretationToLinkedChannels";
import { InterpretedLog } from "../../../src";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

describe("Reporting failure interpretation", () => {

    interface AddressChannelsSpy {
        messagesSent: SlackMessage[],
        sentFullLog: boolean
    }

    function fakeAddressChannels(): [AddressChannels, AddressChannelsSpy] {
        const spy: AddressChannelsSpy = {
            messagesSent: [],
            get sentFullLog() {
                return !!this.messagesSent.find(m => m.fileType === "text")
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