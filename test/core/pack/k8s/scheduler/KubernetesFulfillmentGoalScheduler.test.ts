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
import * as assert from "assert";
import { goal } from "../../../../../lib/api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import { SdmGoalFulfillmentMethod } from "../../../../../lib/api/goal/SdmGoalMessage";
import { container } from "../../../../../lib/core/goal/container/container";
import { K8sContainerFulfillerName } from "../../../../../lib/core/goal/container/k8s";
import { KubernetesFulfillmentGoalScheduler } from "../../../../../lib/core/pack/k8s/scheduler/KubernetesFulfillmentGoalScheduler";
import { SdmGoalState } from "../../../../../lib/typings/types";

describe("pack/k8s/scheduler/KubernetesFulfillmentGoalScheduler", () => {

    describe("supports", () => {

        it("should support Container goal", async () => {
            const ks = new KubernetesFulfillmentGoalScheduler();
            const c = container("foo", { containers: [{ name: "node", image: "atomist/node" }] });
            assert(await ks.supports({ goal: c } as any));
        });

        it("should not support any goal", async () => {
            const ks = new KubernetesFulfillmentGoalScheduler();
            const c = goal({ displayName: "foo" });
            assert(!await ks.supports({ goal: c } as any));
        });

    });

    describe("schedule", () => {

        it("should schedule a container goal without fulfillment", async () => {
            const ks = new KubernetesFulfillmentGoalScheduler();
            const ge: SdmGoalEvent = {
                fulfillment: {},
            } as any;
            const c = container(guid(), { containers: [{ name: "node", image: "atomist/node" }] });
            const g = await ks.schedule({ goal: c, goalEvent: ge } as any);

            assert.deepStrictEqual(g.state, SdmGoalState.requested);
            assert.deepStrictEqual(ge.fulfillment, {
                registration: "@atomist/k8s-sdm-skill",
                name: K8sContainerFulfillerName,
                method: SdmGoalFulfillmentMethod.Sdm,
            });
            assert(!!ge.data);
        });

        it("should schedule a container goal with fulfillment", async () => {
            const ks = new KubernetesFulfillmentGoalScheduler();
            const ge: SdmGoalEvent = {
                fulfillment: {},
            } as any;
            const fulfillment = {
                registration: "@atomist/foo",
                name: "job-deploy",
            };
            const registration = { containers: [{ name: "node", image: "atomist/node" }], fulfillment };
            const c = container(guid(), registration);
            const g = await ks.schedule({ goal: c, goalEvent: ge } as any);

            assert.deepStrictEqual(g.state, SdmGoalState.requested);
            assert.deepStrictEqual(ge.fulfillment, {
                ...fulfillment,
                method: SdmGoalFulfillmentMethod.Sdm,
            });
            assert(!!ge.data);
            assert.deepStrictEqual(JSON.parse(ge.data)["@atomist/sdm/container"], registration);
        });

    });

});
