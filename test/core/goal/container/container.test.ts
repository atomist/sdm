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

import * as assert from "power-assert";
import {
    Container,
} from "../../../../lib/core/goal/container/container";
import * as util from "../../../../lib/core/goal/container/util";
import { KubernetesFulfillmentGoalScheduler } from "../../../../lib/core/pack/k8s/scheduler/KubernetesFulfillmentGoalScheduler";
import { KubernetesGoalScheduler } from "../../../../lib/core/pack/k8s/scheduler/KubernetesGoalScheduler";

describe("core/goal/container/container", () => {

    describe("Container.register", () => {

        let origRunningInK8s: any;
        let origRunningAsGoogleCloudFunction: any;
        let origAtomistIsolatedGoal: string | undefined;
        let origAtomistGoalScheduler: string | undefined;
        before(() => {
            origRunningInK8s = Object.getOwnPropertyDescriptor(util, "runningInK8s");
            origRunningAsGoogleCloudFunction = Object.getOwnPropertyDescriptor(util, "runningAsGoogleCloudFunction");
            if (process.env.ATOMIST_ISOLATED_GOAL) {
                origAtomistIsolatedGoal = process.env.ATOMIST_ISOLATED_GOAL;
                delete process.env.ATOMIST_ISOLATED_GOAL;
            }
            if (process.env.ATOMIST_GOAL_SCHEDULER) {
                origAtomistGoalScheduler = process.env.ATOMIST_GOAL_SCHEDULER;
            }
            process.env.ATOMIST_GOAL_SCHEDULER = "kubernetes";
        });
        afterEach(() => {
            if (origRunningInK8s) {
                Object.defineProperty(util, "runningInK8s", origRunningInK8s);
            }
            if (origRunningAsGoogleCloudFunction) {
                Object.defineProperty(util, "runningAsGoogleCloudFunction", origRunningAsGoogleCloudFunction);
            }
        });
        after(() => {
            if (origAtomistIsolatedGoal) {
                process.env.ATOMIST_ISOLATED_GOAL = origAtomistIsolatedGoal;
            }
            if (origAtomistGoalScheduler) {
                process.env.ATOMIST_GOAL_SCHEDULER = origAtomistGoalScheduler;
            } else {
                delete process.env.ATOMIST_GOAL_SCHEDULER;
            }
        });

        it("should register", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container();
            const s: any = {
                configuration: {
                    sdm: {},
                },
            };
            c.register(s);
            assert(!s.configuration.sdm.goalScheduler);
        });

        it("should register in k8s", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => true });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container();
            const s: any = {
                configuration: {
                    sdm: {},
                },
            };
            c.register(s);
            assert(s.configuration.sdm.goalScheduler);
            assert(Array.isArray(s.configuration.sdm.goalScheduler));
            assert(s.configuration.sdm.goalScheduler.length === 1);
            assert(s.configuration.sdm.goalScheduler[0] instanceof KubernetesGoalScheduler);
        });

        it("should register in GCF", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => true });
            const c = new Container();
            const s: any = {
                configuration: {
                    sdm: {},
                },
            };
            c.register(s);
            assert(s.configuration.sdm.goalScheduler);
            assert(Array.isArray(s.configuration.sdm.goalScheduler));
            assert(s.configuration.sdm.goalScheduler.length === 1);
            assert(s.configuration.sdm.goalScheduler[0] instanceof KubernetesFulfillmentGoalScheduler);
        });

        it("should not add another scheduler in k8s", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => true });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container();
            const s: any = {
                configuration: {
                    sdm: {
                        goalScheduler: [new KubernetesGoalScheduler()],
                    },
                },
            };
            c.register(s);
            assert(s.configuration.sdm.goalScheduler);
            assert(Array.isArray(s.configuration.sdm.goalScheduler));
            assert(s.configuration.sdm.goalScheduler.length === 1);
            assert(s.configuration.sdm.goalScheduler[0] instanceof KubernetesGoalScheduler);
        });

        it("should add fulfillment scheduler in GCF", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => true });
            const c = new Container();
            const s: any = {
                configuration: {
                    sdm: {
                        goalScheduler: [new KubernetesGoalScheduler()],
                    },
                },
            };
            c.register(s);
            assert(s.configuration.sdm.goalScheduler);
            assert(Array.isArray(s.configuration.sdm.goalScheduler));
            assert(s.configuration.sdm.goalScheduler.length === 2);
            assert(s.configuration.sdm.goalScheduler[0] instanceof KubernetesGoalScheduler);
            assert(s.configuration.sdm.goalScheduler[1] instanceof KubernetesFulfillmentGoalScheduler);
        });

    });

    describe("Container.with", () => {

        let origRunningInK8s: any;
        let origRunningAsGoogleCloudFunction: any;
        before(() => {
            origRunningInK8s = Object.getOwnPropertyDescriptor(util, "runningInK8s");
            origRunningAsGoogleCloudFunction = Object.getOwnPropertyDescriptor(util, "runningAsGoogleCloudFunction");
        });
        afterEach(() => {
            if (origRunningInK8s) {
                Object.defineProperty(util, "runningInK8s", origRunningInK8s);
            }
            if (origRunningAsGoogleCloudFunction) {
                Object.defineProperty(util, "runningAsGoogleCloudFunction", origRunningAsGoogleCloudFunction);
            }
        });

        it("should with", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container();
            const r = {
                containers: [],
                name: "container-goal",
            };
            c.with(r);
            assert(c.details.scheduler);
            assert(c.fulfillments);
            assert(Array.isArray(c.fulfillments));
            assert(c.fulfillments.length === 1);
        });

        it("should with using provided scheduler", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => true });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => true });
            let scheduled = false;
            const c = new Container({ scheduler: () => { scheduled = true; } });
            const r = {
                containers: [],
                name: "container-goal",
            };
            c.with(r);
            assert(scheduled, "provided scheduler not used");
        });

        it("should with in k8s", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => true });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container();
            const r = {
                containers: [],
                name: "container-goal",
            };
            c.with(r);
            assert(c.details.scheduler);
            assert(c.fulfillments);
            assert(Array.isArray(c.fulfillments));
            assert(c.fulfillments.length === 1);
        });

        it("should with in GCF", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => true });
            const c = new Container();
            const r = {
                containers: [],
                name: "container-goal",
            };
            c.with(r);
            assert(c.details.scheduler);
            assert(c.fulfillments);
            assert(Array.isArray(c.fulfillments));
            assert(c.fulfillments.length === 1);
        });

        it("should add cach project listeners", () => {
            Object.defineProperty(util, "runningInK8s", { value: () => false });
            Object.defineProperty(util, "runningAsGoogleCloudFunction", { value: () => false });
            const c = new Container({ scheduler: () => { } });
            const r = {
                containers: [],
                input: [{ classifier: "in" }],
                name: "container-goal",
                output: [{ classifier: "out", pattern: { directory: "." } }],
            };
            c.with(r);
            assert(c.projectListeners);
            assert(Array.isArray(c.projectListeners));
            assert(c.projectListeners.length === 2);
            assert(c.projectListeners.some(l => l.name === "restoring inputs"));
            assert(c.projectListeners.some(l => l.name === "caching outputs"));
        });

    });

});
