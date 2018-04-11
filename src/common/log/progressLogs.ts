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

import { logger } from "@atomist/automation-client";
import { ProgressLog } from "../../spi/log/ProgressLog";

export class ConsoleProgressLog implements ProgressLog {

    public log: string = "";

    public write(what) {
        this.log += what;
        // tslint:disable-next-line:no-console
        console.log(what);
    }

    public flush() { return Promise.resolve(); }

    public close() { return Promise.resolve(); }
}

/**
 * Write to multiple progress logs, exposing them as one
 */
export class MultiProgressLog implements ProgressLog {

    private readonly logs: ProgressLog[];

    constructor(log1: ProgressLog, log2: ProgressLog, ...others: ProgressLog[]) {
        this.logs = [log1, log2].concat(others);
    }

    public write(what: string) {
        this.logs.forEach(log => log.write(what));
    }

    public flush() {
        return Promise.all(this.logs.map(log => log.flush()));
    }

    public close() {
        if (!this.logs) {
            logger.error("This is unexpected! How did I get here without logs?");
            return;
        }
        return Promise.all(this.logs.map(log => log.close()));
    }

    get log(): string {
        const hasLog = this.logs.find(l => l.log !== undefined);
        return !!hasLog ? hasLog.log : undefined;
    }

    get url(): string {
        const hasUrl = this.logs.find(l => !!l.url);
        return !!hasUrl ? hasUrl.url : undefined;
    }
}
