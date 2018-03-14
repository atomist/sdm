import { HandleCommand } from "@atomist/automation-client";
import { reportRunningCommand, ReportRunningParameters } from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/goals/commonGoals";

export const K8sTestingDomain = "testing";
export const K8sProductionDomain = "production";

export const PCFTestingDomain = "ri-staging";
export const PCFProductionDomain = "ri-production";

export const DescribeStagingAndProd: () => HandleCommand<ReportRunningParameters> = () => reportRunningCommand(
    [
        {domain: PCFTestingDomain, color: "#aa93c4"},
        {domain: PCFProductionDomain, color: ProductionMauve}]);
