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

import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { Float } from "@atomist/microgrammar/primitives";
import {
    InterpretedLog,
    LogInterpreter,
} from "../../../../../spi/log/InterpretedLog";

// TODO base on common build info
export interface MavenInfo {

    timeMillis?: number;
}

export type MavenInterpretedLog = InterpretedLog<MavenInfo>;

export const interpretMavenLog: LogInterpreter<MavenInfo> = log => {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .join("\n");
    const mg = Microgrammar.fromString<{seconds: number}>("Total time: ${seconds} s", {
        seconds: Float,
    });
    const timing = mg.firstMatch(log);
    return {
        relevantPart,
        message: "Maven log",
        includeFullLog: true,
        data: {
            timeMillis: !!timing ? timing.seconds * 1000 : undefined,
        },
    };
};
