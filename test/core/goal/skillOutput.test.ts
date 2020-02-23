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

import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { MutationOptions } from "@atomist/automation-client/src/lib/spi/graph/GraphClient";
import * as assert from "power-assert";
import { CacheOutputGoalDataKey } from "../../../lib/core/goal/cache/goalCaching";
import { SkillOutputGoalExecutionListener } from "../../../lib/core/goal/skillOutput";
import { SdmGoalState } from "../../../lib/typings/types";

describe("skillOutput", () => {

    const configuration = {
        name: "test-skill",
        version: "0.1.0",
    } as any;

    const defaultGoalEvent = {
        branch: "master",
        sha: guid(),
        repo: {
            owner: "atomist",
            name: "foo",
        },
        push: {
            repo: {
                id: "repoId1234",
                org: {
                    id: "ownerId1234",
                },
            },
        },
    } as any;

    const defaultContext = {
        correlationId: guid(),
        workspaceId: "T123456",
        graphClient: {
            mutate: async () => {
                assert.fail();
            },
        },
    } as any;

    const defaultOutput = {
        [CacheOutputGoalDataKey]: [{
            type: "build",
            uri: "https://gs.com/1.zip",
            classifier: "T123456/build",
        }, {
            uri: "https://gs.com/2.zip",
            classifier: "T123456/version",
        }],
    };

    it("should correctly ignore failed goal with no output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: {
                ...defaultGoalEvent,
                state: SdmGoalState.failure,
            },
            result: undefined,
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly ignore failed goal with output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: {
                ...defaultGoalEvent,
                state: SdmGoalState.failure,
                data: JSON.stringify(defaultOutput),
            },
            result: undefined,
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly ignore failed result with no output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: defaultGoalEvent,
            result: { code: 1 },
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly ignore failed result with output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: {
                ...defaultGoalEvent,
                data: JSON.stringify(defaultOutput),
            },
            result: { state: SdmGoalState.failure },
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly ignore error result with no output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: defaultGoalEvent,
            error: new Error("test failed"),
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly ignore error result with output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: {
                ...defaultGoalEvent,
                data: JSON.stringify(defaultOutput),
            },
            error: new Error("test failed"),
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly skip goal with no output in data", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: defaultGoalEvent,
            result: undefined,
            context: defaultContext,
            configuration,
        } as any);
    });

    it("should correctly store single skill output", async () => {
        await SkillOutputGoalExecutionListener({
            goalEvent: {
                ...defaultGoalEvent,
                data: JSON.stringify(defaultOutput),
            },
            context: {
                ...defaultContext,
                graphClient: {
                    mutate: async (opts: MutationOptions<any>) => {
                        assert.deepStrictEqual(opts.variables.output, {
                            _branch: defaultGoalEvent.branch,
                            _owner: defaultGoalEvent.repo.owner,
                            _repo: defaultGoalEvent.repo.name,
                            _sha: defaultGoalEvent.sha,
                            classifier: defaultOutput[CacheOutputGoalDataKey][0].classifier.split("/")[1],
                            correlationId: defaultContext.correlationId,
                            orgParentId: defaultGoalEvent.push.repo.org.id,
                            repoParentId: defaultGoalEvent.push.repo.id,
                            skill: {
                                name: configuration.name,
                                version: configuration.version,
                            },
                            type: "build",
                            uri: "https://gs.com/1.zip",
                        });
                    },
                },
            },
            configuration,
        } as any);
    });

});
