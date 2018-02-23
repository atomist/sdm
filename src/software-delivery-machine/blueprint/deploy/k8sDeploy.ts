import {
    ContextToPlannedPhase, HttpServicePhases, StagingDeploymentContext,
    StagingEndpointContext
} from "../../../handlers/events/delivery/phases/httpServicePhases";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus";
import { NoticeK8sDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";

export const K8sStagingDeployOnSuccessStatus = () =>
    new RequestK8sDeployOnSuccessStatus(
        HttpServicePhases,
        ContextToPlannedPhase[StagingEndpointContext]);

export const NoticeK8sDeployCompletion = new NoticeK8sDeployCompletionOnStatus(
    ContextToPlannedPhase[StagingDeploymentContext],
    ContextToPlannedPhase[StagingEndpointContext])