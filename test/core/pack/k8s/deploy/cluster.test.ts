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
    IndependentOfEnvironment,
    ProductionEnvironment,
    ProjectDisposalEnvironment,
    StagingEnvironment,
} from "../../../../../lib/api/goal/support/environment";
import {
    getCluster,
    getClusterLabel,
} from "../../../../../lib/core/pack/k8s/deploy/cluster";

describe("pack/k8s/deploy/cluster", () => {

    describe("getCluster", () => {

        it("should return the fulfillment and environment", () => {
            const e = "messiaen";
            const f = "gbv";
            const l = getCluster(e, f);
            assert(l === "gbv messiaen");
        });

        it("should return the fulfillment", () => {
            const e = "";
            const f = "gbv";
            const l = getCluster(e, f);
            assert(l === "gbv");
        });

        it("should return remove package scope from fulfillment", () => {
            const e = "messiaen";
            const f = "@gbv/alien-lanes";
            const l = getCluster(e, f);
            assert(l === "alien-lanes messiaen");
        });

        it("should parse the cluster from fulfillment", () => {
            const e = "messiaen";
            const f = "@gbv/alien-lanes_motor-away";
            const l = getCluster(e, f);
            assert(l === "motor-away messiaen");
        });

        it("should only match up to the first /", () => {
            const e = "messiaen";
            const f = "@gbv/alien-lanes_motor/away";
            const l = getCluster(e, f);
            assert(l === "motor/away messiaen");
        });

        it("should not remove leading @ if no /", () => {
            const e = "messiaen";
            const f = "@gbv-alien-lanes-motor-away";
            const l = getCluster(e, f);
            assert(l === "@gbv-alien-lanes-motor-away messiaen");
        });

        it("should handle an environment string", () => {
            const e = "messiaen";
            const l = getCluster(e);
            assert(l === e);
        });

        it("should handle production", () => {
            const e = ProductionEnvironment;
            const l = getCluster(e);
            assert(l === "production");
        });

        it("should handle staging", () => {
            const e = StagingEnvironment;
            const l = getCluster(e);
            assert(l === "testing");
        });

        it("should return code for independent", () => {
            const e = IndependentOfEnvironment;
            const l = getCluster(e);
            assert(l === "code");
        });

        it("should return doom for doom", () => {
            const e = ProjectDisposalEnvironment;
            const l = getCluster(e);
            assert(l === "doom");
        });

        it("should return lieven for 8-lieven/", () => {
            const e = "8-lieven/";
            const l = getCluster(e);
            assert(l === "lieven");
        });

        it("should return an empty string", () => {
            const e = "";
            const l = getCluster(e);
            assert(l === "");
        });

    });

    describe("getClusterLabel", () => {

        it("should return the fulfillment and environment", () => {
            const e = "messiaen";
            const f = "gbv";
            const l = getClusterLabel(e, f);
            assert(l === " to `gbv messiaen`");
        });

        it("should return the fulfillment", () => {
            const e: string = undefined;
            const f = "gbv";
            const l = getClusterLabel(e, f);
            assert(l === " to `gbv`");
        });

        it("should return remove package scope from fulfillment", () => {
            const e = "messiaen";
            const f = "@gbv/alien-lanes";
            const l = getClusterLabel(e, f);
            assert(l === " to `alien-lanes messiaen`");
        });

        it("should parse the cluster from fulfillment", () => {
            const e = "messiaen";
            const f = "@gbv/alien-lanes_motor-away";
            const l = getClusterLabel(e, f);
            assert(l === " to `motor-away messiaen`");
        });

        it("should handle an environment string", () => {
            const d = "messiaen";
            const l = getClusterLabel(d);
            assert(l === " to `messiaen`");
        });

        it("should handle production", () => {
            const d = ProductionEnvironment;
            const l = getClusterLabel(d);
            assert(l === " to `production`");
        });

        it("should handle staging", () => {
            const d = StagingEnvironment;
            const l = getClusterLabel(d);
            assert(l === " to `testing`");
        });

        it("should return code for independent", () => {
            const d = IndependentOfEnvironment;
            const l = getClusterLabel(d);
            assert(l === " independent of environment");
        });

        it("should return doom for doom", () => {
            const d = ProjectDisposalEnvironment;
            const l = getClusterLabel(d);
            assert(l === " to `doom`");
        });

        it("should return lieven for 8-lieven/", () => {
            const d = "8-lieven/";
            const l = getClusterLabel(d);
            assert(l === " to `lieven`");
        });

        it("should return an empty string", () => {
            const e = "";
            const l = getClusterLabel(e);
            assert(l === "");
        });

    });

});
