import { HandlerContext } from "@atomist/automation-client";
import { addressChannelsFor, HasChannels } from "../../commands/editors/toclient/addressChannels";

export interface ProgressLog {
    write(what: string): void;
}

export const DevNullProgressLog: ProgressLog = {
    write() {
        // Do nothing
    },
};

export const ConsoleProgressLog: ProgressLog = {
    write(what) {
        console.log(what);
    },
};

export function slackProgressLog(hasChannels: HasChannels, ctx: HandlerContext): ProgressLog {
    const add = addressChannelsFor(hasChannels, ctx);
    return {
        write(msg) {
            add(msg);
        },
    };
}

export class MultiProgressLog implements ProgressLog {

    constructor(private log1: ProgressLog, private log2: ProgressLog) {}

    public write(what: string): void {
        this.log1.write(what);
        this.log2.write(what);
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

    public write(what: string): void {
        const filtered = this.filter(what);
        if (!!filtered) {
            this.log.write(what);
        }
    }
}

export class SavingProgressLog implements ProgressLog {

    private logged: string = "";

    public write(what: string): void {
        this.logged += what;
    }

    get log() {
        return this.logged;
    }
}
