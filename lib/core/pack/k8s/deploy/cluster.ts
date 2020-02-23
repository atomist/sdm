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

import {
    ProductionEnvironment,
    StagingEnvironment,
} from "../../../../api/goal/support/environment";

/**
 * Determine cluster name from goal environment and fulfillment.  If
 * the fulfillment is provided, the cluster name is parsed from the
 * goal fulfillment name, stripping any NPM scope and everything
 * before the first underscore, `_`, if they exist.
 *
 * If there is no fulfillment, the cluster name derived from the goal
 * environment.  An environment of `StagingEnvironment` or
 * `ProductionEnvironment` is mapped to an appropriate string.  Any
 * other goal environment is simplified to the name of the
 * environment.  If the environment is not truthy an empty string is
 * returned.  Otherwise the `environment` string is returned
 * unchanged.
 *
 * @param environment FulfillableGoalDetails.environment
 * @param fulfillment GoalFulfillment.name
 * @return cluster name
 */
export function getCluster(environment: string, fulfillment?: string): string {
    if (fulfillment && environment) {
        return cleanFulfillment(fulfillment) + " " + envString(environment);
    } else if (fulfillment) {
        return cleanFulfillment(fulfillment);
    } else if (environment) {
        return envString(environment);
    } else {
        return "";
    }
}

/**
 * Generate the tail of a goal label using [[getCluster]] to determine
 * an appropriate deployment target.
 *
 * @param environment FulfillableGoalDetails.environment
 * @param fulfillment GoalFulfillment.name
 * @return Formatted phrase including cluster name
 */
export function getClusterLabel(environment: string, fulfillment?: string): string {
    const cluster = getCluster(environment, fulfillment);
    if (cluster === "code") {
        return " independent of environment";
    } else if (cluster) {
        return ` to \`${cluster}\``;
    } else {
        return "";
    }
}

function cleanFulfillment(fulfillment: string): string {
    return fulfillment.replace(/^@.*?\//, "").replace(/^.*?_/, "");
}

function envString(environment: string): string {
    const geRegExp = /^\d+-(\w+)\/$/;
    // GoalEnvironments are strings, so check if string matches pattern
    if (geRegExp.test(environment)) {
        switch (environment) {
            case StagingEnvironment:
                return "testing";
            case ProductionEnvironment:
                return "production";
            default:
                return environment.replace(geRegExp, "$1");
        }
    } else {
        return environment;
    }
}
