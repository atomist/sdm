import { NoticeK8sDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { RequestK8sDeployOnSuccessStatus } from "../../../handlers/events/delivery/deploy/k8s/RequestDeployOnSuccessStatus";
import {
    ContextToPlannedPhase, HttpServicePhases, StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/phases/httpServicePhases";
import {
    ProductionDeploymentContext,
    ProductionDeploymentPhase,
    ProductionDeployPhases, ProductionEndpointContext,
} from "../../../handlers/events/delivery/phases/productionDeployPhases";

import {DeployToK8OnFingerprint} from "../../../handlers/events/delivery/deploy/k8s/DeployToK8OnFingerprint";
import {OnDeployToProductionFingerprint} from "../../../typings/types";
import {HandleEvent} from "@atomist/automation-client";
import {Maker} from "@atomist/automation-client/util/constructionUtils";
import {promotedEnvironment} from "../../K8sSoftwareDeliveryMachine";


export const K8sStagingDeployOnSuccessStatus = () =>
    new RequestK8sDeployOnSuccessStatus(
        HttpServicePhases,
        ContextToPlannedPhase[StagingDeploymentContext]);

export const NoticeK8sStagingDeployCompletion = new NoticeK8sDeployCompletionOnStatus(
    ContextToPlannedPhase[StagingDeploymentContext],
    ContextToPlannedPhase[StagingEndpointContext],
    "testing");

export const NoticeK8sProductionDeployCompletion = new NoticeK8sDeployCompletionOnStatus(
    ContextToPlannedPhase[ProductionDeploymentContext],
    ContextToPlannedPhase[ProductionEndpointContext],
    promotedEnvironment.name);

export const K8sProductionDeployOnFingerprint: Maker<HandleEvent<OnDeployToProductionFingerprint.Subscription>> = () =>
    new DeployToK8OnFingerprint(
        ProductionDeployPhases,
        ProductionDeploymentPhase)
