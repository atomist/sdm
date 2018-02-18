import { HandlerContext } from "@atomist/automation-client";
import { addressChannelsFor, HasChannels } from "../../../commands/editors/toclient/addressChannels";

export interface ProgressLog {

    write(what: string): void;

    flush(): Promise<any>;

    close(): Promise<any>;
}

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

export function slackProgressLog(hasChannels: HasChannels, ctx: HandlerContext): ProgressLog {
    const add = addressChannelsFor(hasChannels, ctx);
    return {
        write(msg) {
            add(msg);
        },
        flush() { return Promise.resolve(); },
        close() { return Promise.resolve(); },
    };
}

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
        return Promise.all(this.logs.map(log => log.close()));
    }

    /**
     * This can be cast to QueryableProgressLog if any of the logs is queryable
     */
    get log() {
        const q = this.logs.find(l => !!(l as QueryableProgressLog).log);
        if (!!q) {
            return (q as QueryableProgressLog).log;
        }
    }
}

export class TransformingProgressLog implements ProgressLog {

    /**
     *
     * @param {ProgressLog} log
     * @param {(what: string) => string} filter if filter returns undefined
     * don't output anything
     */
    constructor(private log: ProgressLog, private filter: (what: string) => string) {}

    public write(what: string) {
        const filtered = this.filter(what);
        return !!filtered ?
            this.log.write(what) :
            Promise.resolve();
    }

    public flush() {
        return this.log.flush();
    }

    public close() {
        return this.log.close();
    }
}

export interface QueryableProgressLog extends ProgressLog {
    log: string;
}

/**
 * Saves log to a string
 */
export class SavingProgressLog implements QueryableProgressLog {

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

export interface LinkablePersistentProgressLog extends ProgressLog {

    url: string;

}

export type LinkableLogFactory = () => Promise<LinkablePersistentProgressLog>;
