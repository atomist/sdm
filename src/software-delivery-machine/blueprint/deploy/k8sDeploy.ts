import { NoticeK8sDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus";
import { RequestK8sDeployOnSuccessStatus1 } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus1";
import {
    ContextToPlannedPhase, HttpServicePhases, ProductionDeploymentContext, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/phases/httpServicePhases";
import { K8sProductionDomain, K8sTestingDomain } from "./describeRunningServices";

export const K8sStagingDeployOnSuccessStatus = () =>
    new RequestK8sDeployOnSuccessStatus(
        HttpServicePhases,
        ContextToPlannedPhase[StagingDeploymentContext],
        K8sTestingDomain);

export const K8sProductionDeployOnSuccessStatus = () =>
    // TODO replace this evil hack of the duplicate class
    new RequestK8sDeployOnSuccessStatus1(
        HttpServicePhases,
        ContextToPlannedPhase[ProductionDeploymentContext],
        K8sProductionDomain);

export const NoticeK8sDeployCompletion = new NoticeK8sDeployCompletionOnStatus(
    ContextToPlannedPhase[StagingDeploymentContext],
    ContextToPlannedPhase[StagingEndpointContext]);
