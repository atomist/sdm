import {HandleCommand} from "@atomist/automation-client";
import {reportRunningCommand, ReportRunningParameters} from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/phases/httpServicePhases";

export const DescribeStagingAndProd: () => HandleCommand<ReportRunningParameters> = () => reportRunningCommand(
    [
        {domain: "staging", color: "#aa93c4"},
        {domain: "production", color: ProductionMauve}]);
