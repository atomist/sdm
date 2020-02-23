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

import * as assert from "power-assert";
import { SdmContext } from "../../../../lib/api/context/SdmContext";
import { SdmGoalEvent } from "../../../../lib/api/goal/SdmGoalEvent";
import {
    ContainerInput,
    ContainerOutput,
    ContainerProjectHome,
    ContainerResult,
} from "../../../../lib/core/goal/container/container";
import {
    containerEnvVars,
} from "../../../../lib/core/goal/container/util";

describe("goal/container/util", () => {

    describe("containerEnvVars", () => {

        it("should add k8s service to goal event data", async () => {
            const sge: SdmGoalEvent = {
                branch: "psychedelic-rock",
                goalSetId: "0abcdef-123456789-abcdef",
                repo: {
                    name: "odessey-and-oracle",
                    owner: "TheZombies",
                    providerId: "CBS",
                },
                sha: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                uniqueName: "BeechwoodPark.ts#L243",
            } as any;
            const c: SdmContext = {
                context: {
                    graphClient: {
                        query: async () => ({ SdmVersion: [{ version: "1968.4.19" }] }),
                    },
                },
                correlationId: "fedcba9876543210-0123456789abcdef-f9e8d7c6b5a43210",
                workspaceId: "AR05343M1LY",
            } as any;
            const ge = await containerEnvVars(sge, c);
            const e = [
                {
                    name: "ATOMIST_SLUG",
                    value: "TheZombies/odessey-and-oracle",
                },
                {
                    name: "ATOMIST_OWNER",
                    value: "TheZombies",
                },
                {
                    name: "ATOMIST_REPO",
                    value: "odessey-and-oracle",
                },
                {
                    name: "ATOMIST_SHA",
                    value: "7ee1af8ee2f80ad1e718dbb2028120b3a2984892",
                },
                {
                    name: "ATOMIST_BRANCH",
                    value: "psychedelic-rock",
                },
                {
                    name: "ATOMIST_VERSION",
                    value: "1968.4.19",
                },
                {
                    name: "ATOMIST_GOAL",
                    value: `${ContainerInput}/goal.json`,
                },
                {
                    name: "ATOMIST_RESULT",
                    value: ContainerResult,
                },
                {
                    name: "ATOMIST_INPUT_DIR",
                    value: ContainerInput,
                },
                {
                    name: "ATOMIST_OUTPUT_DIR",
                    value: ContainerOutput,
                },
                {
                    name: "ATOMIST_PROJECT_DIR",
                    value: ContainerProjectHome,
                },
            ];
            assert.deepStrictEqual(ge, e);
        });

    });
});
