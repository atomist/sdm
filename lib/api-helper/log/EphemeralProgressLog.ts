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

import { logger } from "@atomist/automation-client";
import {
    ProgressLog,
    ProgressLogFactory,
} from "../../spi/log/ProgressLog";
import { format } from "./format";

/**
 * Implementation of ProgressLog log that returns
 * an undefined link because it isn't actually persisted.
 * Used when we are not storing a local log.
 * Writes to logger at info level.
 */
class EphemeralProgressLog implements ProgressLog {

    public log: string = "";

    public url: string = undefined;

    constructor(public name: string, private readonly writeToLog: boolean = true) {}

    public async isAvailable(): Promise<boolean> { return true; }

    public flush(): Promise<void> {
        return Promise.resolve();
    }

    public async close(): Promise<void> {
        if (this.writeToLog) {
            logger.info(`Progress log '${this.name}'\n${this.log.trim()}`);
        }
    }

    public write(what: string, ...args: string[]): void {
        let line = format(what, ...args);
        if (!line.endsWith("\n")) {
             line += "\n";
        }
        this.log += line;
    }

}

export const createEphemeralProgressLog: ProgressLogFactory = async (context, sdmGoal) => new EphemeralProgressLog(sdmGoal.uniqueName);
