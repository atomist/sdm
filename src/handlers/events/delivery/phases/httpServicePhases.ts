import {
    GitHubStatusContext,
    IndependentOfEnvironment,
    PhaseEnvironment,
    ProductionEnvironment,
    splitContext,
    StagingEnvironment,
} from "../../../../common/goals/gitHubContext";
import { Goal, Goals } from "../../../../common/goals/Goal";

export const ScanGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-scan",
    completedDescription: "Code scan passed",
});

export const BuildGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2-build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
});

export const ArtifactPhase = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2.5-artifact",
    displayName: "store artifact",
    completedDescription: "Stored artifact",
});

export const StagingDeploymentPhase = new Goal({
    environment: StagingEnvironment,
    orderedName: "3-deploy", displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
});

export const StagingEndpointPhase = new Goal({
    environment: StagingEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Test",
    completedDescription: "Here is the service endpoint in Test",
});

export const StagingVerifiedPhase = new Goal({
    environment: StagingEnvironment,
    orderedName: "5-verifyEndpoint",
    displayName: "verify Test deployment",
    completedDescription: "Verified endpoint in Test",
});

export const ProductionDeploymentPhase = new Goal({
    environment: ProductionEnvironment,
    orderedName: "3-prod-deploy",
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod",
});

export const ProductionEndpointPhase = new Goal({
    environment: ProductionEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Prod",
    completedDescription: "Here is the service endpoint in Prod",

});

export const LocalDeploymentPhase = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-deploy locally",
    completedDescription: "Deployed locally",
});

export const LocalEndpointPhase = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2-endpoint",
    displayName: "locate local service endpoint",
    completedDescription: "Here is the local service endpoint",

});

export const ImmaterialPhase = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-immaterial",
    displayName: "immaterial",
    completedDescription: "No material changes",

});

const AllKnownPhases = [
    ScanGoal,
    BuildGoal,
    ArtifactPhase,
    StagingDeploymentPhase,
    StagingEndpointPhase,
    StagingVerifiedPhase,
    ProductionDeploymentPhase,
    ProductionEndpointPhase,
    LocalDeploymentPhase,
    LocalEndpointPhase,
    ImmaterialPhase,
];

export const StagingDeploymentContext = StagingDeploymentPhase.context;
export const StagingEndpointContext = StagingEndpointPhase.context;
export const StagingVerifiedContext = StagingVerifiedPhase.context;
export const ProductionDeploymentContext = ProductionDeploymentPhase.context;
export const ProductionEndpointContext = ProductionEndpointPhase.context;
export const ScanContext = ScanGoal.context;
export const BuildContext = BuildGoal.context;
export const ArtifactContext = ArtifactPhase.context;

export const ProductionMauve = "#cf5097";

export const ContextToPlannedPhase: { [key: string]: Goal } = {};
AllKnownPhases.forEach(p => ContextToPlannedPhase[p.context] = p);

export function contextToPlannedPhase(ghsc: GitHubStatusContext): Goal {
    return contextToKnownPhase(ghsc) ||
        defaultPhaseDefinition(ghsc);
}

export function contextToKnownPhase(ghsc: GitHubStatusContext): Goal {
    return ContextToPlannedPhase[ghsc];
}

function defaultPhaseDefinition(ghsc: GitHubStatusContext): Goal {
    const interpreted = splitContext(ghsc);
    return new Goal({
        environment: interpreted.envPart + "/" as PhaseEnvironment,
        orderedName: interpreted.phasePart,
    });
}

/**
 * Special Goals object to be returned if changes are immaterial.
 * The identity of this object is important.
 * @type {Goals}
 */
export const ImmaterialPhases = new Goals([
    ImmaterialPhase]);

/**
 * Goals for an Http service
 * @type {Goals}
 */
export const HttpServicePhases = new Goals([
    ScanGoal,
    BuildGoal,
    ArtifactPhase,
    StagingDeploymentPhase,
    StagingEndpointPhase,
    StagingVerifiedPhase,
    ProductionDeploymentPhase,
    ProductionEndpointPhase]);

export const LocalDeploymentPhases = new Goals([
    LocalDeploymentPhase,
    LocalEndpointPhase]);
