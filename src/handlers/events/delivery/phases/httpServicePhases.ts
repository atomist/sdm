import { Phases, PlannedPhase } from "../Phases";
import { ArtifactContext, BaseContext, BuildContext, ScanContext, StagingEnvironment } from "./gitHubContext";

export const CloudFoundryStagingDeploymentContext = BaseContext + StagingEnvironment + "3-PCF deploy";
export const StagingEndpointContext = BaseContext + StagingEnvironment + "4-endpoint";
export const StagingVerifiedContext = BaseContext + StagingEnvironment + "5-verifyEndpoint";

export const ContextToPlannedPhase: { [key: string]: PlannedPhase } = {};
ContextToPlannedPhase[ScanContext] = {context: ScanContext, name: "scan"};
ContextToPlannedPhase[BuildContext] = {context: BuildContext, name: "build"};
ContextToPlannedPhase[ArtifactContext] = {context: ArtifactContext, name: "find artifact"};
ContextToPlannedPhase[CloudFoundryStagingDeploymentContext] = {
    context: CloudFoundryStagingDeploymentContext,
    name: "deploy to Test space in PCF",
};
ContextToPlannedPhase[StagingEndpointContext] = {context: StagingEndpointContext, name: "find endpoint in Test"};
ContextToPlannedPhase[StagingVerifiedContext] = {context: StagingVerifiedContext, name: "verify endpoint in Test"};

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([
    ScanContext,
    BuildContext,
    ArtifactContext,
    CloudFoundryStagingDeploymentContext,
    StagingEndpointContext,
    StagingVerifiedContext]);
