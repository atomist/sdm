import { Phases, PlannedPhase } from "../Phases";
import { BaseContext, BuiltContext, ScanContext, StagingEnvironment } from "./core";

export const CloudFoundryStagingDeploymentContext = BaseContext + StagingEnvironment + "3-PCF deploy";
export const StagingEndpointContext = BaseContext + StagingEnvironment + "4-endpoint";
export const StagingVerifiedContext = BaseContext + StagingEnvironment + "5-verifyEndpoint";

export const ContextToPlannedPhase: { [key: string]: PlannedPhase } = {};
ContextToPlannedPhase[ScanContext] = {context: ScanContext, name: "scan"};
ContextToPlannedPhase[BuiltContext] = {context: BuiltContext, name: "build"};
ContextToPlannedPhase[CloudFoundryStagingDeploymentContext] = {
    context: CloudFoundryStagingDeploymentContext,
    name: "deploy to staging",
};
ContextToPlannedPhase[StagingEndpointContext] = {context: StagingEndpointContext, name: "find endpoint in staging"};
ContextToPlannedPhase[StagingVerifiedContext] = {context: StagingVerifiedContext, name: "verify endpoint in staging"};

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([
    ScanContext,
    BuiltContext,
    CloudFoundryStagingDeploymentContext,
    StagingEndpointContext,
    StagingVerifiedContext]);
