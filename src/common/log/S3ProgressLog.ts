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

import S3StreamLogger = require("s3-streamlogger");
import winston = require("winston");
import { ProgressLog} from "../../spi/log/ProgressLog";

export class S3ProgressLog implements ProgressLog {

    private readonly winstonLogger;

    constructor(s3StreamLogger: S3StreamLogger) {
        this.winstonLogger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({timestamp: true}),
                new (winston.transports.File)({stream: s3StreamLogger, timestamp: true}),
            ],
        });
    }

    public write(what) {
        this.winstonLogger.info(what);
    }

    public flush() { return Promise.resolve(); }

    public close() { return Promise.resolve(); }
}
