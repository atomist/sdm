/*
 * Copyright © 2018 Atomist, Inc.
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

import {HandlerContext} from "@atomist/automation-client";
import {SdmGoal} from "../api/goal/SdmGoal";
import {ProgressLog} from "../spi/log/ProgressLog";
import {RolarProgressLog} from "./RolarProgressLog";

/**
 * Persistent Rolar log that displays in the Dashboard
 */
export class DashboardDisplayProgressLog implements ProgressLog {

    private readonly rolarProgressLog: RolarProgressLog;

    constructor(private readonly dashboardBaseUrl: string,
                rolarBaseUrl: string,
                private readonly context: HandlerContext,
                private readonly sdmGoal: SdmGoal) {
        this.rolarProgressLog = new RolarProgressLog(rolarBaseUrl, constructLogPath(context, sdmGoal));
    }

    get name() {
        return this.rolarProgressLog.name;
    }

    get url() {
        if (this.dashboardBaseUrl) {
            const path = constructLogPath(this.context, this.sdmGoal);
            return `${this.dashboardBaseUrl}/workspace/${path[0]}/logs/${path.slice(1).join("/")}`;
        } else {
            return this.rolarProgressLog.url;
        }
    }

    public async isAvailable(): Promise<boolean> {
        return this.rolarProgressLog.isAvailable();
    }

    public write(what: string) {
        this.rolarProgressLog.write(what);
    }

    public flush(): Promise<any> {
        return this.rolarProgressLog.flush();
    }

    public close(): Promise<any> {
        return this.rolarProgressLog.close();
    }

}

export function constructLogPath(context: HandlerContext, sdmGoal: SdmGoal): string[] {
    return [
        context.teamId,
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.sha,
        sdmGoal.environment,
        sdmGoal.name,
        sdmGoal.goalSetId,
        context.correlationId,
    ];
}
