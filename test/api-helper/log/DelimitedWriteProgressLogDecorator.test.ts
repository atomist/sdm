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

import * as assert from "power-assert";
import { DelimitedWriteProgressLogDecorator } from "../../../lib/api-helper/log/DelimitedWriteProgressLogDecorator";
import { createEphemeralProgressLog } from "../../../lib/api-helper/log/EphemeralProgressLog";
import { format } from "../../../lib/api-helper/log/format";
import { ProgressLog } from "../../../lib/spi/log/ProgressLog";

class ListProgressLog implements ProgressLog {

    public logList: string[] = [];

    public readonly name: string = "ListProgressLog";

    public async close(): Promise<void> {
        return;
    }

    public async flush(): Promise<void> {
        return;
    }

    public write(msg: string, ...args: string[]): void {
        this.logList.push(format(msg, args));
    }

    public async isAvailable(): Promise<boolean> {
        return true;
    }
}

describe("DelimitedWriteProgressLogDecorator", () => {

    it("should not complete line until delimited", async () => {
        const delegateLog = new ListProgressLog();
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack");
        log.write(" and I'm");
        log.write(" OK\n");
        log.write("I sleep all night and I work all day\n");

        assert.deepEqual(delegateLog.logList, [
            "I'm a lumberjack and I'm OK\n",
            "I sleep all night and I work all day\n",
        ]);
    });

    it("should split into multiple log lines if delimiter is encountered", async () => {
        const delegateLog = new ListProgressLog();
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" night and I work all day\n");

        assert.deepEqual(delegateLog.logList, [
            "I'm a lumberjack and I'm OK\n",
            "I sleep all night and I work all day\n",
        ]);
    });

    it("should write remainder of logs on flush", async () => {
        const delegateLog = new ListProgressLog();
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" night and I work all day");
        await log.flush();

        assert.deepEqual(delegateLog.logList, [
            "I'm a lumberjack and I'm OK\n",
            "I sleep all night and I work all day",
        ]);
    });

    it("Should include newlines in its log property", async () => {
        const delegateLog = await createEphemeralProgressLog({} as any, { name: "hi" } as any);
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" night and I work all day");
        await log.flush();

        assert.deepEqual(log.log,
            "I'm a lumberjack and I'm OK\nI sleep all night and I work all day",
        );
    });

    it("should include printf style placeholders", async () => {
        const delegateLog = await createEphemeralProgressLog({} as any, { name: "hi" } as any);
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" %s and I work %s day", "night", "all");
        await log.flush();

        assert.deepEqual(log.log,
            "I'm a lumberjack and I'm OK\nI sleep all night and I work all day",
        );
    });

});
