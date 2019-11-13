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

import { ProgressLog } from "../../spi/log/ProgressLog";
import { format } from "./format";

/**
 * Sometimes new log lines are separated by a character rather than a call to write.
 * For example, when receiving data events from a child process newlines delimit log lines.
 */
export class DelimitedWriteProgressLogDecorator implements ProgressLog {

    private lineBuffer: string = "";

    constructor(private readonly delegate: ProgressLog,
                private readonly lineDelimiter: string) {
    }

    get name(): string {
        return this.delegate.name;
    }

    get url(): string {
        return this.delegate.url;
    }

    get log(): string {
        return this.delegate.log;
    }

    public async isAvailable(): Promise<boolean> {
        return this.delegate.isAvailable();
    }

    public write(msg: string, ...args: string[]): void {
        this.lineBuffer += format(msg, ...args);
        const splitLines = this.lineBuffer.split(this.lineDelimiter);
        if (splitLines.length > 1) {
            const completedLines = splitLines.slice(0, splitLines.length - 1);
            this.lineBuffer = splitLines[splitLines.length - 1];
            completedLines.forEach(l => this.delegate.write(l + this.lineDelimiter));
        }
    }

    public flush(): Promise<void> {
        this.writeRemainder();
        return this.delegate.flush();
    }

    public close(): Promise<void> {
        this.writeRemainder();
        return this.delegate.close();
    }

    private writeRemainder(): void {
        const remainder = this.lineBuffer;
        this.lineBuffer = "";
        this.delegate.write(remainder);
    }
}
