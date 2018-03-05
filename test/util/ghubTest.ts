import "mocha";
import * as assert from "power-assert";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { PhaseCreationInvocation, PushToPublicRepo } from "../../src";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

const pretendRepo = new GitHubRepoRef("socks", "dots");
describe("a guard against deploying private repos", () => {
    var mock = new MockAdapter(axios);

    it("Says no to a private repo", async () => {
        const pci = {id: pretendRepo} as any as PhaseCreationInvocation;
        mock.onGet('https://api.github.com/repos/socks/dots').reply(200, {
            private: true,
        });
        const result = await Promise.resolve(PushToPublicRepo(pci));

        assert.equal(result, false)
    });

    it("Says yes to a public repo", async () => {
        const pci = {id: pretendRepo} as any as PhaseCreationInvocation;
        mock.onGet('https://api.github.com/repos/socks/dots').reply(200, {
            private: false,
        });

        const result = await Promise.resolve(PushToPublicRepo(pci));

        assert(result === true)
    })

    it("Throws if it cannot find out about the repo", async () => {
        const pci = {id: pretendRepo} as any as PhaseCreationInvocation;
        // Mock any GET request to /users
// arguments for reply are (status, data, headers)
        mock.onGet('https://api.github.com/repos/socks/dots').reply(500);

        const threw = await Promise.resolve(PushToPublicRepo(pci))
            .then(happy =>
                    Promise.reject(new Error("that should fail")),
                err => true);

        assert(threw === true)
    })

    it("Savs no on 404", async () => {
        const pci = {id: pretendRepo} as any as PhaseCreationInvocation;
        mock.onGet('https://api.github.com/repos/socks/dots').reply(404);

        const result = await Promise.resolve(PushToPublicRepo(pci));

        assert.equal(result, false)
    })
});