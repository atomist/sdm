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

import stripAnsi from "strip-ansi";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { format } from "./format";

/**
 * ProgressLog implementation that captures the log into a string and makes it
 * available from the log field
 */
export class StringCapturingProgressLog implements ProgressLog {

    public readonly name: string = "StringCapturingProgressLog";

    public log: string = "";

    public stripAnsi: boolean = false;

    public close(): Promise<void> {
        return Promise.resolve();
    }

    public flush(): Promise<void> {
        return Promise.resolve();
    }

    public write(msg: string, ...args: string[]): void {
        const m = this.stripAnsi ? stripAnsi(msg) : msg;
        if (this.log) {
            this.log += format(m, ...args);
        } else {
            this.log = format(m, ...args);
        }
    }

    public isAvailable(): Promise<boolean> {
        return Promise.resolve(true);
    }
}
