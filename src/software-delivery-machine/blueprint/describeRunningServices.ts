import {reportRunningCommand, ReportRunningParameters} from "../../handlers/commands/reportRunning";
import {HandleCommand} from "@atomist/automation-client";
import {ProductionMauve} from "../../handlers/events/delivery/phases/productionDeployPhases";


export const describeStagingAndProd: HandleCommand<ReportRunningParameters> = reportRunningCommand(
    [
        {domain: "ri-staging", color: "#aa93c4"},
        {domain: "ri-production", color: ProductionMauve}]);