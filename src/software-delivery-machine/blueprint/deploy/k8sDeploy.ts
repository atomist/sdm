import { NoticeK8sTestDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { NoticeK8sProdDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sProdDeployCompletion";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestK8sDeployOnSuccessStatus";
import { RequestK8sDeployOnSuccessStatus1 } from "../../../handlers/events/delivery/deploy/k8s/RequestK8sDeployOnSuccessStatus1";
import {
    ContextToPlannedGoal,
    ProductionDeploymentContext,
    ProductionEndpointContext,
    StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { K8sProductionDomain, K8sTestingDomain } from "./describeRunningServices";

export const K8sStagingDeployOnSuccessStatus = {
    eventHandlers: [() =>
        new RequestK8sDeployOnSuccessStatus(
            ContextToPlannedGoal[StagingDeploymentContext],
            K8sTestingDomain)], commandHandlers: []
};

export const K8sProductionDeployOnSuccessStatus = {
    eventHandlers: [() =>
        // TODO replace this evil hack of the duplicate class
        new RequestK8sDeployOnSuccessStatus1(
            ContextToPlannedGoal[ProductionDeploymentContext],
            K8sProductionDomain)], commandHandlers: []
};

export const NoticeK8sTestDeployCompletion = new NoticeK8sTestDeployCompletionOnStatus(
    ContextToPlannedGoal[StagingDeploymentContext],
    ContextToPlannedGoal[StagingEndpointContext]);

export const NoticeK8sProdDeployCompletion = new NoticeK8sProdDeployCompletionOnStatus(
    ContextToPlannedGoal[ProductionDeploymentContext],
    ContextToPlannedGoal[ProductionEndpointContext]);
