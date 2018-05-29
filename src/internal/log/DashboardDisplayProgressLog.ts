
import {HandlerContext} from "@atomist/automation-client";
import {SdmGoal} from "../../ingesters/sdmGoalIngester";
import {ProgressLog} from "../../spi/log/ProgressLog";
import {RolarProgressLog} from "./RolarProgressLog";

/**
 * Persistent Rolar log that displays in the Dashboard
 */
export class DashboardDisplayProgressLog implements ProgressLog {

    private readonly rolarProgressLog: RolarProgressLog;

    constructor(private readonly dashboardBaseUrl: string,
                rolarBaseUrl: string,
                private readonly context: HandlerContext,
                private readonly sdmGoal: SdmGoal) {
        this.rolarProgressLog = new RolarProgressLog(rolarBaseUrl, constructLogPath(context, sdmGoal));
    }

    get name() {
        return this.rolarProgressLog.name;
    }

    get url() {
        if (this.dashboardBaseUrl) {
            const path = constructLogPath(this.context, this.sdmGoal);
            return `${this.dashboardBaseUrl}/workspace/${path[0]}/logs/${path.slice(1).join("/")}`;
        } else {
            return this.rolarProgressLog.url;
        }
    }

    public async isAvailable(): Promise<boolean> {
        return this.rolarProgressLog.isAvailable();
    }

    public write(what: string) {
        this.rolarProgressLog.write(what);
    }

    public flush(): Promise<any> {
        return this.rolarProgressLog.flush();
    }

    public close(): Promise<any> {
        return this.rolarProgressLog.close();
    }

}

export function constructLogPath(context: HandlerContext, sdmGoal: SdmGoal): string[] {
    return [
        context.teamId,
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.sha,
        sdmGoal.environment,
        sdmGoal.name,
        sdmGoal.goalSetId,
        context.correlationId,
    ];
}
