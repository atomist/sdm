import {
    BaseContext, GitHubStatusContext, IndependentOfEnvironment, PhaseEnvironment, ProductionEnvironment,
    splitContext, StagingEnvironment,
} from "../../../../common/phases/gitHubContext";
import { Phases, PlannedPhase } from "../../../../common/phases/Phases";


export const ScanPhase = new PlannedPhase({
    environment: IndependentOfEnvironment,
    orderedName: "1-scan",
    completedDescription: "Code scan passed",
});
export const BuildPhase = new PlannedPhase({
    environment: IndependentOfEnvironment,
    orderedName: "2-build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
});
export const ArtifactPhase = new PlannedPhase({
    environment: IndependentOfEnvironment,
    orderedName: "2.5-artifact",
    displayName: "find artifact",
    completedDescription: "Located artifact"
});
export const StagingDeploymentPhase = new PlannedPhase({
    environment: StagingEnvironment,
    orderedName: "3-deploy", displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
});
export const StagingEndpointPhase = new PlannedPhase({
    environment: StagingEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Test",
    completedDescription: "Here is the service endpoint in Test",
});
export const StagingVerifiedPhase = new PlannedPhase({
    environment: StagingEnvironment,
    orderedName: "5-verifyEndpoint",
    displayName: "verify Test deployment",
    completedDescription: "Verified endpoint in Test"
});
export const ProductionDeploymentPhase = new PlannedPhase({
    environment: ProductionEnvironment,
    orderedName: "3-prod-deploy",
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod"
});
export const ProductionEndpointPhase = new PlannedPhase({
    environment: ProductionEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Prod",
    completedDescription: "Here is the service endpoint in Prod"

});

const AllKnownPhases = [
    ScanPhase,
    BuildPhase,
    ArtifactPhase,
    StagingDeploymentPhase,
    StagingEndpointPhase,
    StagingVerifiedPhase,
    ProductionDeploymentPhase,
    ProductionEndpointPhase,
];

export const StagingDeploymentContext = StagingDeploymentPhase.context;
export const StagingEndpointContext = StagingEndpointPhase.context;
export const StagingVerifiedContext = StagingVerifiedPhase.context;
export const ProductionDeploymentContext = ProductionDeploymentPhase.context;
export const ProductionEndpointContext = ProductionEndpointPhase.context;
export const ScanContext = ScanPhase.context;
export const BuildContext = BuildPhase.context;
export const ArtifactContext = ArtifactPhase.context;

export const ProductionMauve = "#cf5097";

export const ContextToPlannedPhase: { [key: string]: PlannedPhase } = {};
AllKnownPhases.forEach(p => ContextToPlannedPhase[p.context] = p);

export function contextToPlannedPhase(ghsc: GitHubStatusContext): PlannedPhase {
    return contextToKnownPhase(ghsc) ||
        defaultPhaseDefinition(ghsc);
}

export function contextToKnownPhase(ghsc: GitHubStatusContext): PlannedPhase {
    return ContextToPlannedPhase[ghsc]
}

function defaultPhaseDefinition(ghsc: GitHubStatusContext): PlannedPhase {
    const interpreted = splitContext(ghsc);
    return new PlannedPhase({
        environment: interpreted.envPart as PhaseEnvironment,
        orderedName: interpreted.phasePart,
    });
}

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([
    ScanPhase,
    BuildPhase,
    ArtifactPhase,
    StagingDeploymentPhase,
    StagingEndpointPhase,
    StagingVerifiedPhase,
    ProductionDeploymentPhase,
    ProductionEndpointPhase]);
