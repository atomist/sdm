import {
    ArtifactContext, BaseContext, BuildContext, GitHubStatusContext, ScanContext, splitContext,
    StagingEnvironment, ProductionEnvironment
} from "../../../../common/phases/gitHubContext";
import { Phases, PlannedPhase } from "../../../../common/phases/Phases";

export const StagingDeploymentContext = BaseContext + StagingEnvironment + "3-deploy";
export const StagingEndpointContext = BaseContext + StagingEnvironment + "4-endpoint";
export const StagingVerifiedContext = BaseContext + StagingEnvironment + "5-verifyEndpoint";
export const ProductionDeploymentContext = BaseContext + ProductionEnvironment + "3-PCF-prod-deploy";
export const ProductionEndpointContext = BaseContext + ProductionEnvironment + "4-endpoint";
export const ProductionVerifiedContext = BaseContext + ProductionEnvironment + "5-verifyEndpoint";

export const ProductionMauve = "#cf5097";

export const ContextToPlannedPhase: { [key: string]: PlannedPhase } = {};
ContextToPlannedPhase[ScanContext] = {context: ScanContext, name: "scan"};
ContextToPlannedPhase[BuildContext] = {context: BuildContext, name: "build"};
ContextToPlannedPhase[ArtifactContext] = {context: ArtifactContext, name: "find artifact"};
ContextToPlannedPhase[StagingDeploymentContext] = {
    context: StagingDeploymentContext,
    name: "deploy to Test space",
};
ContextToPlannedPhase[StagingEndpointContext] = {context: StagingEndpointContext, name: "find endpoint in Test"};
ContextToPlannedPhase[StagingVerifiedContext] = {context: StagingVerifiedContext, name: "verify endpoint in Test"};
ContextToPlannedPhase[ProductionDeploymentContext] = { context: ProductionDeploymentContext, name: "deploy to production" };
ContextToPlannedPhase[ProductionEndpointContext] =  { context: ProductionEndpointContext, name: "find production endpoint" };
//export const ProductionVerifiedPhase =  { context: ProductionVerifiedContext, name: "verify production endpoint" };

export function contextToPlannedPhase(ghsc: GitHubStatusContext): PlannedPhase {
    return ContextToPlannedPhase[ghsc] ||
        defaultPhaseDefinition(ghsc);
}

function defaultPhaseDefinition(ghsc: GitHubStatusContext): PlannedPhase {
    const interpreted = splitContext(ghsc);
    return {
        context: ghsc,
        name: interpreted.name,
    };
}

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([
    ScanContext,
    BuildContext,
    ArtifactContext,
    StagingDeploymentContext,
    StagingEndpointContext,
    StagingVerifiedContext,
    ProductionDeploymentContext,
    ProductionEndpointContext]);
