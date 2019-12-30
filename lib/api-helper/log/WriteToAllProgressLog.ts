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

import { logger } from "@atomist/automation-client/lib/util/logger";
import { ProgressLog } from "../../spi/log/ProgressLog";

/**
 * Write to multiple progress logs, exposing them as one.
 */
export class WriteToAllProgressLog implements ProgressLog {

    private readonly logs: ProgressLog[];

    constructor(public name: string, log1: ProgressLog, log2: ProgressLog, ...others: ProgressLog[]) {
        this.logs = [log1, log2].concat(others);
    }

    public async isAvailable(): Promise<boolean> {
        return true;
    }

    public write(msg: string, ...args: string[]): void {
        this.logs.forEach(log => log.write(msg, ...args));
    }

    public async flush(): Promise<void> {
        await Promise.all(this.logs.map(log => log.flush()));
    }

    public async close(): Promise<void> {
        if (!this.logs) {
            logger.error("This is unexpected! How did I get here without logs?");
            return;
        }
        await Promise.all(this.logs.map(log => log.close()));
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
