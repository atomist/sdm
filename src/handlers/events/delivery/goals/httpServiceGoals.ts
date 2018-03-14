import { Goals } from "../../../../common/goals/Goal";
import {
    ArtifactGoal, AutofixGoal, BuildGoal, CodeReactionGoal, FingerprintGoal, LocalDeploymentGoal, LocalEndpointGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal, ReviewGoal,
    StagingDeploymentGoal, StagingEndpointGoal, StagingVerifiedGoal,
} from "./commonGoals";

/**
 * Goals for an Http service
 * @type {Goals}
 */
export const HttpServiceGoals = new Goals(
    FingerprintGoal,
    AutofixGoal,
    ReviewGoal,
    CodeReactionGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal);

export const LocalDeploymentGoals = new Goals(
    LocalDeploymentGoal,
    LocalEndpointGoal);
