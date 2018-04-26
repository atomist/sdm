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

import * as _ from "lodash";

import axios from "axios";
import { ProgressLog } from "../../spi/log/ProgressLog";

import { logger } from "@atomist/automation-client";
import { doWithRetry } from "@atomist/automation-client/util/retry";

import os = require("os");

/**
 * Post log to Atomist Rolar service for it to persist
 */
export class RolarProgressLog implements ProgressLog {

    private localLogs: LogData[] = [];

    constructor(private readonly rolarBaseUrl: string, private readonly logPath: string[]) {
    }

    get name() {
        return this.logPath.join("_");
    }

    public async isAvailable() {
        const url = `${this.rolarBaseUrl}/api/logs`;
        try {
            axios.head(url);
            logger.warn("Rolar logger is NOT available at %s", url);
            return true;
        } catch {
            return false;
        }
    }

    public write(what: string) {
        this.localLogs.push({
            level: "info",
            message: what,
            timestamp: this.constructUtcTimestamp(),
        } as LogData);
    }

    public flush(): Promise<any> {
        return this.postLogs(false);
    }

    public close(): Promise<any> {
        return this.postLogs(true);
    }

    private async postLogs(isClosed: boolean): Promise<any> {
        const closedRequestParam = isClosed ? "?closed=true" : "";
        const url = `${this.rolarBaseUrl}/api/logs/${this.logPath.join("/")}${closedRequestParam}`;
        const postingLogs = this.localLogs;
        this.localLogs = [];
        const result = await doWithRetry(() => axios.post(url, {
                host: os.hostname(),
                content: postingLogs,
            }, {
                headers: {"Content-Type": "application/json"},
            }),
            `post log to Rolar`).catch(e => {
            this.localLogs = postingLogs.concat(this.localLogs);
            logger.error(e);
        });
        return result;
    }

    private constructUtcTimestamp() {
        const now: Date = new Date();
        const date = [now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCFullYear()];
        const time = [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
            .map(t => _.padStart(t.toString(), 2));
        return `${date.join("/")} ${time.join(":")}.${_.padStart(now.getUTCMilliseconds().toString(), 3)}`;
    }
}

interface LogData {
    level: string;
    message: string;
    timestamp: string;
}
