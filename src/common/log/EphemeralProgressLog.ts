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

import { logger } from "@atomist/automation-client";
import { ProgressLog, ProgressLogFactory } from "../../spi/log/ProgressLog";

/**
 * Implementation of ProgressLog log that returns
 * an undefined link because it isn't actually persisted.
 * Used when we are not storing a local log.
 * Writes to logger at info level.
 */
class EphemeralProgressLog implements ProgressLog {

    public log = "";

    public url = undefined;

    constructor(public name: string, private readonly writeToLog: boolean = true) {}

    public async isAvailable() { return true; }

    public flush() {
        return Promise.resolve();
    }

    public async close(): Promise<any> {
        if (this.writeToLog) {
            logger.info("vvvvvv CLOSED NON-PERSISTENT LOG ------------------------------");
            logger.info(this.log);
            logger.info("^^^^^^ NON-PERSISTENT LOG -------------------------------------");
        }
    }

    public write(what: string) {
        this.log += what;
    }

}

export const createEphemeralProgressLog: ProgressLogFactory = async (context, sdmGoal) => new EphemeralProgressLog(sdmGoal.name);
