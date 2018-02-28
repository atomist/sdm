import { logger } from "@atomist/automation-client";
import { LinkableLogFactory, LinkableProgressLog, QueryableProgressLog } from "./ProgressLog";

/**
 * Implementation of LinkableProgressLog log that returns
 * an undefined link because it isn't actually persisted.
 * Used when we are not storing a local log.
 */
class EphemeralLinkableProgressLog implements LinkableProgressLog, QueryableProgressLog {

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

export const createEphemeralLinkableProgressLog: LinkableLogFactory = () =>
    Promise.resolve(new EphemeralLinkableProgressLog());
