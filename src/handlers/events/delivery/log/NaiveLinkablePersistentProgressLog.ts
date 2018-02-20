
import {LinkablePersistentProgressLog, QueryableProgressLog} from "./ProgressLog";

class NaiveLinkablePersistentProgressLog implements LinkablePersistentProgressLog, QueryableProgressLog {

    public log = "";

    constructor(public url: string) {}

    public flush() {
        return Promise.resolve();
    }

    public close(): Promise<any> {
        console.log(`CLOSED LOG WITH url=[${this.url}]-----------------------`);
        console.log(this.log);
        console.log(`--------------------------------------------------------`);
        return Promise.resolve();
    }

    public write(what: string) {
        this.log += what;
    }

}

export function createLinkableProgressLog(): Promise<LinkablePersistentProgressLog & QueryableProgressLog> {
    const url = "http://foo.bar/" + new Date().getMilliseconds();
    return Promise.resolve(new NaiveLinkablePersistentProgressLog(url));
}
