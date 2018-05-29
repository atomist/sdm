
import {HandlerContext} from "@atomist/automation-client";
import * as assert from "power-assert";
import {SdmGoal} from "../../../src/ingesters/sdmGoalIngester";
import {DashboardDisplayProgressLog} from "../../../src/internal/log/DashboardDisplayProgressLog";

describe("DashboardDisplayProgressLog", () => {

    const context: HandlerContext = {
        teamId: "TeamID",
        correlationId: "CorrelationID",
        messageClient: undefined,
    };

    const goal: SdmGoal = {
        repo: {
            owner: "RepoOwner",
            name: "RepoName",
            providerId: undefined,
        },
        sha: "SHA1",
        environment: "ENV",
        name: "GoalName",
        goalSetId: "GoalSetId",
        uniqueName: undefined,
        branch: undefined,
        fulfillment: undefined,
        description: undefined,
        goalSet: undefined,
        state: undefined,
        ts: undefined,
        provenance: undefined,
        preConditions: undefined,
    };

    it("should construct dashboard log URL", () => {
        const log = new DashboardDisplayProgressLog("http://dashboardhost", "http://rolarhost",
            context, goal);
        assert.equal(log.url,
            "http://dashboardhost/workspace/TeamID/logs/RepoOwner/RepoName/SHA1/ENV/GoalName/GoalSetId/CorrelationID");
    });

    it("should delegate to Rolar URL if dashboard base URL is not specified", () => {
        const log = new DashboardDisplayProgressLog(undefined, "http://rolarhost",
            context, goal);
        assert.equal(log.url,
            "http://rolarhost/logs/TeamID/RepoOwner/RepoName/SHA1/ENV/GoalName/GoalSetId/CorrelationID");
    });

});
