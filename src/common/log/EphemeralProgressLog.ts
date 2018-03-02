import { logger } from "@atomist/automation-client";
import { LogFactory, ProgressLog } from "../../spi/log/ProgressLog";

/**
 * Implementation of LinkableProgressLog log that returns
 * an undefined link because it isn't actually persisted.
 * Used when we are not storing a local log.
 */
class EphemeralProgressLog implements ProgressLog {

    public log = "";

    public url = undefined;

    public flush() {
        return Promise.resolve();
    }

    public close(): Promise<any> {
        logger.info("vvvvvv CLOSED NON-PERSISTENT LOG ------------------------------");
        logger.info(this.log);
        logger.info("^^^^^^ NON-PERSISTENT LOG -------------------------------------");
        return Promise.resolve();
    }

    public write(what: string) {
        this.log += what;
    }

}

export const createEphemeralProgressLog: LogFactory = () =>
    Promise.resolve(new EphemeralProgressLog());
