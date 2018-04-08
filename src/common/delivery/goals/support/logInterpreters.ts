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

import { InterpretedLog, LogInterpreter } from "../../../../spi/log/InterpretedLog";

export function lastTenLinesLogInterpreter(message: string): LogInterpreter {
    return (log: string): InterpretedLog => {
        return {
            relevantPart: log.split("\n").slice(-10).join("\n"),
            message,
            includeFullLog: true,
        };
    };
}

/**
 * Use when we don't want to report the log to the user under
 * any circumstances
 * @param {string} log
 * @return {InterpretedLog}
 * @constructor
 */
export const LogSuppressor: LogInterpreter = (log: string): InterpretedLog => {
    return {
        relevantPart: "",
        message: "Do not report to user",
        includeFullLog: false,
        doNotReportToUser: true,
    };
};
