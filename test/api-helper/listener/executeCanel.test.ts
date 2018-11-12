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

import { guid } from "@atomist/automation-client";
import { fail } from "power-assert";
import { executeCancelGoalSets } from "../../../lib/api-helper/listener/executeCancel";
import { AutoCodeInspection } from "../../../lib/api/goal/common/AutoCodeInspection";
import { Autofix } from "../../../lib/api/goal/common/Autofix";
import { CancelOptions } from "../../../lib/api/goal/common/Cancel";
import { SdmGoalState } from "../../../lib/typings/types";
import assert = require("power-assert");

const autofix = new Autofix();
const codeInspection = new AutoCodeInspection();

describe("executeCancelGoalSets", () => {

    it("should find no pending goals", async () => {
        const options: CancelOptions = {
            goals: [autofix, codeInspection],
        };
        const cancel = executeCancelGoalSets(options, "CancelGoal");

        const result = await cancel({
            configuration: {
                name: "@atomist/my-sdm",
            },
            sdmGoal: {
                push: {
                    before: {
                        sha: "015f119ccb0af8096ab08364dcccfa7149c36ea7",
                    },
                },
                sha: "b360c489167758a705d11be4668049568282bd13",
                branch: "some-branch",
                repo: {
                    name: "foo",
                    owner: "bar",
                    providerId: "foobar",
                },
            },
            context: {
                graphClient: {
                    query: async (optionsOrName: { variables: { sha: string, branch: string, repo: string, owner: string, providerId: string, uniqueNames: string[] } }) => {
                        assert.strictEqual(optionsOrName.variables.sha, "015f119ccb0af8096ab08364dcccfa7149c36ea7");
                        assert.strictEqual(optionsOrName.variables.branch, "some-branch");
                        assert.strictEqual(optionsOrName.variables.repo, "foo");
                        assert.strictEqual(optionsOrName.variables.owner, "bar");
                        assert.strictEqual(optionsOrName.variables.providerId, "foobar");
                        assert.deepStrictEqual(optionsOrName.variables.uniqueNames, [autofix.uniqueName, codeInspection.uniqueName]);

                        return {
                            SdmGoal: [],
                        };
                    },
                },
            },
        } as any);

        assert(result === undefined);
    });

    it("should find pending goals but cancel none", async () => {
        const options: CancelOptions = {
            goals: [autofix, codeInspection],
            goalFilter: goal => goal.state === SdmGoalState.in_process,
        };
        const cancel = executeCancelGoalSets(options, "CancelGoal");

        const result = await cancel({
            configuration: {
                name: "@atomist/my-sdm",
            },
            sdmGoal: {
                push: {
                    before: {
                        sha: "015f119ccb0af8096ab08364dcccfa7149c36ea7",
                    },
                },
                sha: "b360c489167758a705d11be4668049568282bd13",
                branch: "some-branch",
                repo: {
                    name: "foo",
                    owner: "bar",
                    providerId: "foobar",
                },
            },
            context: {
                graphClient: {
                    query: async optionsOrName => {
                        const goalSetId = guid();
                        return {
                            SdmGoal: [{
                                name: codeInspection.definition.displayName,
                                uniqueName: codeInspection.definition.uniqueName,
                                state: SdmGoalState.success,
                                goalSet: "build",
                                goalSetId,
                                version: 1,
                                provenance: [{
                                    ts: Date.now(),
                                    registration: "@atomist/my-sdm",
                                }]
                            }, {
                                name: autofix.definition.displayName,
                                uniqueName: autofix.definition.uniqueName,
                                state: SdmGoalState.success,
                                goalSet: "build",
                                goalSetId,
                                version: 1,
                                provenance: [{
                                    ts: Date.now(),
                                    registration: "@atomist/my-sdm",
                                }]
                            }],
                        };
                    },
                },
                messageClient: {
                    send: async () => {
                        fail();
                    },
                },
                context: {
                    name: "test",
                    version: "1.0.0",
                    correlationId: guid(),
                }
            },
            progressLog: {
                write: () => {},
            },
        } as any);

        assert(result === undefined);
    });

    it("should find pending goals and cancel one", async () => {
        const options: CancelOptions = {
            goals: [autofix, codeInspection],
            goalFilter: goal => goal.state === SdmGoalState.in_process,
        };
        const cancel = executeCancelGoalSets(options, "CancelGoal");
        const goalSetId = guid();
        let senrAutofixCancelation = false;

        const result = await cancel({
            configuration: {
                name: "@atomist/my-sdm",
            },
            sdmGoal: {
                push: {
                    before: {
                        sha: "015f119ccb0af8096ab08364dcccfa7149c36ea7",
                    },
                },
                sha: "b360c489167758a705d11be4668049568282bd13",
                branch: "some-branch",
                repo: {
                    name: "foo",
                    owner: "bar",
                    providerId: "foobar",
                },
            },
            context: {
                graphClient: {
                    query: async () => {

                        return {
                            SdmGoal: [{
                                name: codeInspection.definition.displayName,
                                uniqueName: codeInspection.definition.uniqueName,
                                state: SdmGoalState.success,
                                goalSet: "build",
                                goalSetId,
                                version: 1,
                                provenance: [{
                                    ts: Date.now(),
                                    registration: "@atomist/my-sdm",
                                }]
                            }, {
                                name: autofix.definition.displayName,
                                uniqueName: autofix.definition.uniqueName,
                                state: SdmGoalState.in_process,
                                goalSet: "build",
                                goalSetId,
                                version: 1,
                                provenance: [{
                                    ts: Date.now(),
                                    registration: "@atomist/my-sdm",
                                }]
                            }, {
                                name: codeInspection.definition.displayName,
                                uniqueName: codeInspection.definition.uniqueName,
                                state: SdmGoalState.in_process,
                                goalSet: "build",
                                goalSetId: guid(),
                                version: 1,
                                provenance: [{
                                    ts: Date.now(),
                                    registration: "@atomist/my-sdm",
                                }, {
                                    ts: Date.now() - 2,
                                    registration: "@atomist/sdm",
                                }]
                            }],
                        };
                    },
                },
                messageClient: {
                    send: async msg => {
                        assert.strictEqual(msg.uniqueName, autofix.uniqueName);
                        assert.strictEqual(msg.state, SdmGoalState.canceled);
                        senrAutofixCancelation = true;
                    },
                },
                context: {
                    name: "test",
                    version: "1.0.0",
                    correlationId: guid(),
                }
            },
            progressLog: {
                write: () => {},
            },
        } as any);

        assert(result && result.code === 0);
        assert(result && result.description.includes(goalSetId.slice(0, 7)))
        assert(senrAutofixCancelation);
    });
});
