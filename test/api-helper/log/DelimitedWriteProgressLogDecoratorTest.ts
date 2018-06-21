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
import {DelimitedWriteProgressLogDecorator} from "../../../src/api-helper/log/DelimitedWriteProgressLogDecorator";
import { ProgressLog } from "../../../src/spi/log/ProgressLog";

class ListProgressLog implements ProgressLog {

    public logList: string[] = [];

    public readonly name: string = "ListProgressLog";

    public close(): Promise<any> {
        return Promise.resolve();
    }

    public flush(): Promise<any> {
        return Promise.resolve();
    }

    public write(what: string): void {
        this.logList.push(what);
    }

    public isAvailable(): Promise<boolean> {
        return Promise.resolve(true);
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
            "I'm a lumberjack and I'm OK",
            "I sleep all night and I work all day",
        ]);
    });

    it("should split into multiple log lines if delimiter is encountered", async () => {
        const delegateLog = new ListProgressLog();
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" night and I work all day\n");

        assert.deepEqual(delegateLog.logList, [
            "I'm a lumberjack and I'm OK",
            "I sleep all night and I work all day",
        ]);
    });

    it("should write remainder of logs on flush", async () => {
        const delegateLog = new ListProgressLog();
        const log = new DelimitedWriteProgressLogDecorator(delegateLog, "\n");

        log.write("I'm a lumberjack and I'm OK\nI sleep all");
        log.write(" night and I work all day");
        await log.flush();

        assert.deepEqual(delegateLog.logList, [
            "I'm a lumberjack and I'm OK",
            "I sleep all night and I work all day",
        ]);
    });

});
