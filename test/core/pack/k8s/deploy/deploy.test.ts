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
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import {
    destination,
} from "../../../../../lib/core/pack/k8s/deploy/deploy";
import { KubernetesApplication } from "../../../../../lib/core/pack/k8s/kubernetes/request";

describe("pack/k8s/deploy/deploy", () => {

    describe("deployDescription", () => {

        it("should return a proper destination", () => {
            const a: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const d = destination(e, a);
            assert(d === "emi:hounds-of-love/cloudbusting");
        });

        it("should remove package scope", () => {
            const a: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "@wickham/emi",
                },
            } as any;
            const d = destination(e, a);
            assert(d === "emi:hounds-of-love/cloudbusting");
        });

        it("should remove package", () => {
            const a: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "emi_windmill-lane",
                },
            } as any;
            const d = destination(e, a);
            assert(d === "windmill-lane:hounds-of-love/cloudbusting");
        });

        it("should remove package with scope", () => {
            const a: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "@wickham/emi_windmill-lane",
                },
            } as any;
            const d = destination(e, a);
            assert(d === "windmill-lane:hounds-of-love/cloudbusting");
        });

        it("should remove text before first underscore", () => {
            const a: KubernetesApplication = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
            };
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "@wickham/emi_windmill_lane",
                },
            } as any;
            const d = destination(e, a);
            assert(d === "windmill_lane:hounds-of-love/cloudbusting");
        });

        it("should ignore missing application", () => {
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "emi",
                },
            } as any;
            const d = destination(e);
            assert(d === "emi");
        });

        it("should parse fulfillment and ignore missing application", () => {
            const e: SdmGoalEvent = {
                fulfillment: {
                    name: "@wickham/emi_windmill_lane",
                },
            } as any;
            const d = destination(e);
            assert(d === "windmill_lane");
        });

    });

});
