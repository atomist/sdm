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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import {
    defaultHttpClientFactory,
    HttpClient,
    HttpMethod,
} from "@atomist/automation-client/lib/spi/http/httpClient";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { redact } from "@atomist/automation-client/lib/util/redact";
import * as _ from "lodash";
import os = require("os");
import { format } from "../../api-helper/log/format";
import { ProgressLog } from "../../spi/log/ProgressLog";

function* timestampGenerator(): Iterator<Date> {
    while (true) {
        yield new Date();
    }
}

/**
 * Post log to Atomist Rolar service for it to persist
 */
export class RolarProgressLog implements ProgressLog {

    private readonly httpClient: HttpClient;
    private localLogs: LogData[] = [];
    private readonly timer: any;
    private readonly rolarBaseUrl: string;
    private readonly bufferSizeLimit: number;
    private readonly timerInterval: number;
    private readonly redact: boolean;

    constructor(private readonly logPath: string[],
                configuration: Configuration,
                private readonly logLevel: string = "info",
                private readonly timestamper: Iterator<Date> = timestampGenerator()) {
        this.rolarBaseUrl = _.get(configuration, "sdm.rolar.url", "https://rolar.atomist.com");
        this.bufferSizeLimit = _.get(configuration, "sdm.rolar.bufferSize", 10240);
        this.timerInterval = _.get(configuration, "sdm.rolar.flushInterval", 2000);
        this.redact = _.get(configuration, "redact.log", false);
        if (this.timerInterval > 0) {
            this.timer = setInterval(() => this.flush(), this.timerInterval).unref();
        }
        this.httpClient = _.get(configuration, "http.client.factory", defaultHttpClientFactory()).create(this.rolarBaseUrl);
    }

    get name(): string {
        return this.logPath.join("/");
    }

    get url(): string {
        return `${this.rolarBaseUrl}/logs/${this.name}`;
    }

    public async isAvailable(): Promise<boolean> {
        const url = `${this.rolarBaseUrl}/api/logs`;
        try {
            await this.httpClient.exchange(url, { method: HttpMethod.Head });
            return true;
        } catch (e) {
            logger.warn(`Rolar logger is not available at ${url}: ${e}`);
            return false;
        }
    }

    public write(msg: string = "", ...args: string[]): void {
        const fmsg = format(msg, ...args);
        const line = this.redact ? redact(fmsg) : fmsg;
        const now: Date = this.timestamper.next().value;
        this.localLogs.push({
            level: this.logLevel,
            message: line,
            timestamp: this.constructUtcTimestamp(now),
            timestampMillis: this.constructMillisTimestamp(now),
        });
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
        if (this.timer) {
            clearInterval(this.timer);
        }
        return this.postLogs(true);
    }

    private async postLogs(isClosed: boolean): Promise<any> {
        const postingLogs = this.localLogs;
        this.localLogs = [];

        if (isClosed === true || (!!postingLogs && postingLogs.length > 0)) {
            const closedRequestParam = isClosed ? "?closed=true" : "";
            const url = `${this.rolarBaseUrl}/api/logs/${this.logPath.join("/")}${closedRequestParam}`;
            let result;
            try {
                result = await this.httpClient.exchange(url, {
                    method: HttpMethod.Post,
                    body: {
                        host: os.hostname(),
                        content: postingLogs || [],
                    },
                    headers: { "Content-Type": "application/json" },
                    retry: {
                        retries: 0,
                    },
                    options: {
                        timeout: 2500,
                    },
                });
            } catch (err) {
                this.localLogs = postingLogs.concat(this.localLogs);
                if (!/timeout.*exceeded/i.test(err.message)) {
                    logger.error(err.message);
                } else {
                    logger.debug("Calling rolar timed out");
                }
            }
            return result;
        }
        return Promise.resolve();
    }

    private constructUtcTimestamp(d: Date): string {
        const now: Date = d;
        const date = [now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCFullYear()]
            .map(t => _.padStart(t.toString(), 2, "0"));
        const time = [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
            .map(t => _.padStart(t.toString(), 2, "0"));
        return `${date.join("/")} ${time.join(":")}.${_.padStart(now.getUTCMilliseconds().toString(), 3, "0")}`;
    }

    private constructMillisTimestamp(d: Date): number {
        return d.valueOf();
    }
}

interface LogData {
    level: string;
    message: string;
    timestamp: string;
    timestampMillis: number;
}
