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
import { ProgressLog } from "../../spi/log/ProgressLog";

/**
 * Progress log to logger, at a desired logging level
 */
export class LoggingProgressLog implements ProgressLog {

    public log: string = "";

    constructor(public name: string, private readonly level: "debug" | "info" = "debug") {
    }

    public write(pWhat: string) {
        let what = pWhat || "";
        if (what.endsWith("\n\r") || what.endsWith("\r\n")) {
            what = what.slice(0, -2);
        }
        if (what.endsWith("\n")) {
            what = what.slice(0, -1);
        }
        this.log += what;
        switch (this.level) {
            case "info" :
                logger.info(what);
                break;
            default:
                logger.debug(what);
                break;
        }
    }

    public async isAvailable() {
        return true;
    }

    public flush() {
        return Promise.resolve();
    }

    public close() {
        return Promise.resolve();
    }

}
