import { HandleCommand } from "@atomist/automation-client";
import { reportRunningCommand, ReportRunningParameters } from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/phases/httpServicePhases";

export const K8sTestingDomain = "testing";
export const K8sProductionDomain = "production";

export const PCFTestingDomain = "ri-staging";
export const PCFProductionDomain = "ri-production";

export const DescribeStagingAndProd: () => HandleCommand<ReportRunningParameters> = () => reportRunningCommand(
    [
        {domain: K8sTestingDomain, color: "#aa93c4"},
        {domain: K8sProductionDomain, color: ProductionMauve}]);
