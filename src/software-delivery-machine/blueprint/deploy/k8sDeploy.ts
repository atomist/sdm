import { NoticeK8sTestDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { NoticeK8sProdDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sProdDeployCompletion";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus";
import { RequestK8sDeployOnSuccessStatus1 } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus1";
import {
    ContextToPlannedPhase, HttpServiceGoals, ProductionDeploymentContext, ProductionEndpointContext, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { K8sProductionDomain, K8sTestingDomain } from "./describeRunningServices";

export const K8sStagingDeployOnSuccessStatus = () =>
    new RequestK8sDeployOnSuccessStatus(
        HttpServiceGoals,
        ContextToPlannedPhase[StagingDeploymentContext],
        K8sTestingDomain);

export const K8sProductionDeployOnSuccessStatus = () =>
    // TODO replace this evil hack of the duplicate class
    new RequestK8sDeployOnSuccessStatus1(
        HttpServiceGoals,
        ContextToPlannedPhase[ProductionDeploymentContext],
        K8sProductionDomain);

export const NoticeK8sTestDeployCompletion = new NoticeK8sTestDeployCompletionOnStatus(
    ContextToPlannedPhase[StagingDeploymentContext],
    ContextToPlannedPhase[StagingEndpointContext]);

export const NoticeK8sProdDeployCompletion = new NoticeK8sProdDeployCompletionOnStatus(
    ContextToPlannedPhase[ProductionDeploymentContext],
    ContextToPlannedPhase[ProductionEndpointContext]);
