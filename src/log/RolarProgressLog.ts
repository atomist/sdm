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

import * as _ from "lodash";

import axios from "axios";
import {ProgressLog} from "../spi/log/ProgressLog";

import {logger} from "@atomist/automation-client";
import { doWithRetry } from "@atomist/automation-client/util/retry";

import {AxiosInstance} from "axios";
import os = require("os");
import {WrapOptions} from "retry";

function* timestampGenerator() {
    while (true) {
        yield new Date();
    }
}

/**
 * Post log to Atomist Rolar service for it to persist
 */
export class RolarProgressLog implements ProgressLog {

    private localLogs: LogData[] = [];

    constructor(private readonly rolarBaseUrl: string,
                private readonly logPath: string[],
                private readonly bufferSizeLimit: number = 10000,
                private readonly logLevel: string = "info",
                private readonly timestamper: Iterator<Date> = timestampGenerator(),
                private readonly retryOptions: WrapOptions = {},
                private readonly axiosInstance: AxiosInstance = axios) {
    }

    get name() {
        return this.logPath.join("/");
    }

    get url() {
        return `${this.rolarBaseUrl}/logs/${this.name}`;
    }

    public async isAvailable() {
        const url = `${this.rolarBaseUrl}/api/logs`;
        try {
            await doWithRetry(() => this.axiosInstance.head(url),
                `check if Rolar service is available`,
                this.retryOptions);
            return true;
        } catch (e) {
            logger.warn(`Rolar logger is NOT available at ${url}: ${e}`);
            return false;
        }
    }

    public write(what: string) {
        const line = what || "";
        this.localLogs.push({
            level: this.logLevel,
            message: line,
            timestamp: this.constructUtcTimestamp(),
        } as LogData);
        const bufferSize = this.localLogs.reduce((acc, logData) => acc + logData.message.length, 0);
        if (bufferSize > this.bufferSizeLimit) {
            // tslint:disable-next-line:no-floating-promises
            this.flush();
        }
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
        const result = await doWithRetry(() => this.axiosInstance.post(url, {
                host: os.hostname(),
                content: postingLogs,
            }, {
                headers: {"Content-Type": "application/json"},
            }).catch(axiosError =>
                 Promise.reject(new Error(`Failure post to ${url}: ${axiosError.message}`))),
            `post log to Rolar`,
            this.retryOptions).catch(e => {
                this.localLogs = postingLogs.concat(this.localLogs);
                logger.error(e);
            },
        );
        return result;
    }

    private constructUtcTimestamp(): string {
        if (!this.timestamper) { return ""; }
        const now: Date = this.timestamper.next().value;
        const date = [now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCFullYear()]
            .map(t => _.padStart(t.toString(), 2, "0"));
        const time = [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
            .map(t => _.padStart(t.toString(), 2, "0"));
        return `${date.join("/")} ${time.join(":")}.${_.padStart(now.getUTCMilliseconds().toString(), 3, "0")}`;
    }
}

interface LogData {
    level: string;
    message: string;
    timestamp: string;
}
