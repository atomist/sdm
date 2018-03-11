import {
    GitHubStatusContext,
    IndependentOfEnvironment,
    GoalEnvironment,
    ProductionEnvironment,
    splitContext,
    StagingEnvironment,
} from "../../../../common/goals/gitHubContext";
import { Goal, Goals, GoalWithPrecondition } from "../../../../common/goals/Goal";

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

export const ArtifactGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2.5-artifact",
    displayName: "store artifact",
    completedDescription: "Stored artifact",
});

export const StagingDeploymentGoal = new GoalWithPrecondition({
    environment: StagingEnvironment,
    orderedName: "3-deploy", displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
}, ArtifactGoal);

export const StagingEndpointGoal = new Goal({
    environment: StagingEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Test",
    completedDescription: "Here is the service endpoint in Test",
});

export const StagingVerifiedGoal = new Goal({
    environment: StagingEnvironment,
    orderedName: "5-verifyEndpoint",
    displayName: "verify Test deployment",
    completedDescription: "Verified endpoint in Test",
});

export const ProductionDeploymentGoal = new Goal({
    environment: ProductionEnvironment,
    orderedName: "3-prod-deploy",
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod",
});

export const ProductionEndpointGoal = new Goal({
    environment: ProductionEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Prod",
    completedDescription: "Here is the service endpoint in Prod",

});

export const LocalDeploymentGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-deploy locally",
    completedDescription: "Deployed locally",
});

export const LocalEndpointGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2-endpoint",
    displayName: "locate local service endpoint",
    completedDescription: "Here is the local service endpoint",

});

export const NoGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-immaterial",
    displayName: "immaterial",
    completedDescription: "No material changes",

});

const AllKnownGoals = [
    ScanGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    LocalDeploymentGoal,
    LocalEndpointGoal,
    NoGoal,
];

export const StagingDeploymentContext = StagingDeploymentGoal.context;
export const StagingEndpointContext = StagingEndpointGoal.context;
export const StagingVerifiedContext = StagingVerifiedGoal.context;
export const ProductionDeploymentContext = ProductionDeploymentGoal.context;
export const ProductionEndpointContext = ProductionEndpointGoal.context;
export const ScanContext = ScanGoal.context;
export const BuildContext = BuildGoal.context;

export const ProductionMauve = "#cf5097";

export const ContextToPlannedGoal: { [key: string]: Goal } = {};
AllKnownGoals.forEach(p => ContextToPlannedGoal[p.context] = p);

export function contextToGoal(ghsc: GitHubStatusContext): Goal {
    return contextToKnownGoal(ghsc) ||
        defaultGoal(ghsc);
}

export function contextToKnownGoal(ghsc: GitHubStatusContext): Goal {
    return ContextToPlannedGoal[ghsc];
}

function defaultGoal(ghsc: GitHubStatusContext): Goal {
    const interpreted = splitContext(ghsc);
    return new Goal({
        environment: interpreted.envPart + "/" as GoalEnvironment,
        orderedName: interpreted.goalPart,
    });
}

/**
 * Special Goals object to be returned if changes are immaterial.
 * The identity of this object is important.
 * @type {Goals}
 */
export const NoGoals = new Goals([
    NoGoal]);

/**
 * Goals for an Http service
 * @type {Goals}
 */
export const HttpServiceGoals = new Goals([
    ScanGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal]);

export const LocalDeploymentGoals = new Goals([
    LocalDeploymentGoal,
    LocalEndpointGoal]);
