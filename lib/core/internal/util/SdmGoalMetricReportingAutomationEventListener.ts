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

import { AutomationClient } from "@atomist/automation-client/lib/automationClient";
import { EventIncoming } from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import { AutomationEventListenerSupport } from "@atomist/automation-client/lib/server/AutomationEventListener";
import {
    defaultStatsDClientOptions,
    StatsDClient,
} from "@atomist/automation-client/lib/spi/statsd/statsdClient";
import * as cluster from "cluster";
import * as _ from "lodash";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { shouldHandle } from "../delivery/goals/support/validateGoal";

/**
 * Automation listener that reports goal round trip metrics to StatsD.
 */
export class SdmGoalMetricReportingAutomationEventListener extends AutomationEventListenerSupport {

    private statsd: StatsDClient;

    public async startupSuccessful(client: AutomationClient): Promise<void> {
        if (cluster.isMaster && client.configuration.statsd.enabled) {
            this.statsd = client.configuration.statsd.client.factory.create(
                defaultStatsDClientOptions(client.configuration));
        }
    }

    public eventIncoming(payload: EventIncoming): void {
        if (cluster.isMaster && !!this.statsd && process.env.ATOMIST_ISOLATED_GOAL !== "forked") {
            const goal = _.get(payload.data, "SdmGoal[0]") as SdmGoalEvent;

            if (!!goal && shouldHandle(goal)) {
                this.statsd.increment(
                    `counter.goal`,
                    1,
                    1,
                    [`atomist_goal:${goal.name}`],
                    () => {
                        /* intentionally left empty */
                    });
                this.statsd.timing(
                    "timer.goal.round_trip",
                    Date.now() - goal.ts,
                    1,
                    {},
                    () => {
                        /* intentionally left empty */
                    });
            }
        }
    }
}
