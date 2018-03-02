import { NoticeK8sDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus";
import { RequestK8sDeployOnSuccessStatus1 } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus1";
import {
    ContextToPlannedPhase, HttpServicePhases, ProductionDeploymentContext, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/phases/httpServicePhases";

export const K8sStagingDeployOnSuccessStatus = () =>
    new RequestK8sDeployOnSuccessStatus(
        HttpServicePhases,
        ContextToPlannedPhase[StagingDeploymentContext],
        "testing");

export const K8sProductionDeployOnSuccessStatus = () =>
    // TODO replace this evil hack
    new RequestK8sDeployOnSuccessStatus1(
        HttpServicePhases,
        ContextToPlannedPhase[ProductionDeploymentContext],
        "production");

export const NoticeK8sDeployCompletion = new NoticeK8sDeployCompletionOnStatus(
    ContextToPlannedPhase[StagingDeploymentContext],
    ContextToPlannedPhase[StagingEndpointContext]);
