import { guid } from "@atomist/automation-client/internal/util/string";
import "mocha";
import * as assert from "power-assert";
import { PushTestInvocation } from "../../../../src/common/listener/GoalSetter";
import { IsDeployEnabled } from "../../../../src/common/listener/support/deployPushTests";

describe("deployPushTests", () => {

    describe("IsDeployEnabled", () => {

        it("should be disabled by default and correctly set parameters on the query", async () => {
             const pi = {
                 context: {
                     graphClient: {
                         executeQuery(query: string, parameters: any, options: any) {
                             assert.equal(parameters.owner, "atomist");
                             assert.equal(parameters.repo, "github-sdm");
                             return {
                                 SDMDeployEnablement: [],
                             };
                         },
                     },
                 },
                 push: {
                     repo: {
                         owner: "atomist",
                         name: "github-sdm",
                     },
                 },
             };
             const result = await IsDeployEnabled.test(pi as any as PushTestInvocation);
             assert(!result);
        });

        it("should be enabled correctly via setting", async () => {
            const pi = {
                context: {
                    graphClient: {
                        executeQuery(query: string, parameters: any, options: any) {
                            return {
                                SDMDeployEnablement: [ {
                                    id: guid(),
                                    state: "requested",
                                    owner: "atomist",
                                    repo: "github-sdm",
                                    providerId: "123456",
                                }],
                            };
                        },
                    },
                },
                push: {
                    repo: {
                        owner: "atomist",
                        name: "github-sdm",
                    },
                },
            };
            const result = await IsDeployEnabled.test(pi as any as PushTestInvocation);
            assert(result);
        });

        it("should be disabled correctly via setting", async () => {
            const pi = {
                context: {
                    graphClient: {
                        executeQuery(query: string, parameters: any, options: any) {
                            return {
                                SDMDeployEnablement: [ {
                                    id: guid(),
                                    state: "disabled",
                                    owner: "atomist",
                                    repo: "github-sdm",
                                    providerId: "123456",
                                }],
                            };
                        },
                    },
                },
                push: {
                    repo: {
                        owner: "atomist",
                        name: "github-sdm",
                    },
                },
            };
            const result = await IsDeployEnabled.test(pi as any as PushTestInvocation);
            assert(!result);
        });
    });

});
