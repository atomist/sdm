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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import * as _ from "lodash";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { RolarProgressLog } from "./RolarProgressLog";

/**
 * Persistent Rolar log that displays in the Dashboard
 */
export class DashboardDisplayProgressLog implements ProgressLog {

    private readonly rolarProgressLog: RolarProgressLog;
    private readonly dashboardBaseUrl: string;

    constructor(configuration: Configuration,
                private readonly context: HandlerContext,
                private readonly sdmGoal: SdmGoalEvent) {
        this.dashboardBaseUrl = _.get(configuration, "sdm.rolar.webAppUrl",
            _.get(configuration, "sdm.dashboard.url", "https://app.atomist.com"));
        this.rolarProgressLog =
            new RolarProgressLog(constructLogPath(context, sdmGoal), configuration);
    }

    get name(): string {
        return this.rolarProgressLog.name;
    }

    get url(): string {
        const path = constructLogPath(this.context, this.sdmGoal);
        return `${this.dashboardBaseUrl}/workspace/${path[0]}/logs/${path.slice(1).join("/")}`;
    }

    public async isAvailable(): Promise<boolean> {
        return this.rolarProgressLog.isAvailable();
    }

    public write(msg: string, ...args: string[]): void {
        this.rolarProgressLog.write(msg, ...args);
    }

    public flush(): Promise<any> {
        return this.rolarProgressLog.flush();
    }

    public close(): Promise<any> {
        return this.rolarProgressLog.close();
    }

}

export function constructLogPath(context: HandlerContext, sdmGoal: SdmGoalEvent): string[] {
    return [
        context.workspaceId,
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.sha,
        sdmGoal.environment,
        sdmGoal.uniqueName,
        sdmGoal.goalSetId,
        context.correlationId,
    ].map(encodeURIComponent);
}
