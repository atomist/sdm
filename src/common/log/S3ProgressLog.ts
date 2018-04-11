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
