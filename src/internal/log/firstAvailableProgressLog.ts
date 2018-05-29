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

import { ProgressLog } from "../../spi/log/ProgressLog";

/**
 * Return the first available progress log.
 * Error if none is available: Pass in a fallback that's always available.
 * @param log first log
 * @param {ProgressLog} moreLogs
 * @return {Promise<ProgressLog>}
 */
export async function firstAvailableProgressLog(log: ProgressLog, ...moreLogs: ProgressLog[]): Promise<ProgressLog> {
    const logs = [log].concat(...moreLogs);
    for (const pl of logs) {
        const avail = await pl.isAvailable();
        if (avail) {
            return pl;
        }
    }
    throw new Error("No logger available: Please pass in at least one fallback that's always available");
}
