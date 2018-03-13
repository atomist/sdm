import { FunctionalUnit } from "../../../";
import { ExecuteGoalOnSuccessStatus } from "../../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { NoticeK8sTestDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { NoticeK8sProdDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sProdDeployCompletion";
import { requestDeployToK8s } from "../../../handlers/events/delivery/deploy/k8s/RequestK8sDeploys";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { K8sProductionDomain, K8sTestingDomain } from "./describeRunningServices";

export const K8sStagingDeployOnSuccessStatus: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("K8TestDeploy",
            StagingDeploymentGoal,
            requestDeployToK8s(K8sTestingDomain)),
    ],
    commandHandlers: [],
};

export const K8sProductionDeployOnSuccessStatus: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("K8ProductionDeploy",
            ProductionDeploymentGoal,
            requestDeployToK8s(K8sProductionDomain)),
    ],
    commandHandlers: [],
};

export const NoticeK8sTestDeployCompletion = new NoticeK8sTestDeployCompletionOnStatus(
    StagingDeploymentGoal,
    StagingEndpointGoal);

export const NoticeK8sProdDeployCompletion = new NoticeK8sProdDeployCompletionOnStatus(
    ProductionDeploymentGoal,
    ProductionEndpointGoal);
