import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { K8sAutomationBuilder } from "../../../handlers/events/delivery/build/k8s/K8AutomationBuilder";
import {
    BuildContext, BuildGoal,
    HttpServiceGoals,
} from "../../../handlers/events/delivery/goals/httpServiceGoals";

export const K8sBuildOnSuccessStatus = () =>
    new BuildOnScanSuccessStatus(
        BuildGoal,
        { builder: new K8sAutomationBuilder(), test: async () => true});
