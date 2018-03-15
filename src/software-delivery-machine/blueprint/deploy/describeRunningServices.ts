/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandleCommand } from "@atomist/automation-client";
import { reportRunningCommand, ReportRunningParameters } from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/goals/commonGoals";

export const K8sTestingDomain = "testing";
export const K8sProductionDomain = "production";

export const PCFTestingDomain = "ri-staging";
export const PCFProductionDomain = "ri-production";

export const DescribeStagingAndProd: () => HandleCommand<ReportRunningParameters> = () => reportRunningCommand(
    [
        {domain: PCFTestingDomain, color: "#aa93c4"},
        {domain: PCFProductionDomain, color: ProductionMauve}]);
