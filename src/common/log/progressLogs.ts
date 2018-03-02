
import { logger } from "@atomist/automation-client";
import { ProgressLog } from "../../spi/log/ProgressLog";

export const DevNullProgressLog: ProgressLog = {
    write() {
        // Do nothing
    },
    flush() { return Promise.resolve(); },
    close() { return Promise.resolve(); },
};

export const ConsoleProgressLog: ProgressLog = {
    write(what) {
        console.log(what);
    },
    flush() { return Promise.resolve(); },
    close() { return Promise.resolve(); },
};

export class MultiProgressLog implements ProgressLog {

    private readonly logs: ProgressLog[];

    constructor(log1: ProgressLog, log2: ProgressLog, ...others: ProgressLog[]) {
        this.logs = [log1, log2].concat(others);
    }

    public write(what: string) {
        this.logs.forEach(log => log.write(what));
    }

    public flush() {
        return Promise.all(this.logs.map(log => log.flush()));
    }

    public close() {
        if (!this.logs) {
            logger.error("This is unexpected! How did I get here without logs?");
            return;
        }
        return Promise.all(this.logs.map(log => log.close()));
    }

    get log(): string {
        const hasLog = this.logs.find(l => !!l.log);
        return !!hasLog ? hasLog.log : undefined;
    }
}

/**
 * Saves log to a string
 */
export class InMemoryProgressLog implements ProgressLog {

    private logged: string = "";

    public write(what: string) {
        this.logged += what;
        return Promise.resolve();
    }

    public flush() {
        return Promise.resolve();
    }

    public close() {
        return Promise.resolve();
    }

    get log() {
        return this.logged;
    }
}
