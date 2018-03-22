/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GitHubStatusContext,
    GoalEnvironment,
    IndependentOfEnvironment,
    ProductionEnvironment,
    splitContext,
    StagingEnvironment,
} from "../gitHubContext";
import {
    Goal,
    GoalWithPrecondition,
} from "../Goal";
import { Goals } from "../Goals";

export const FingerprintGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "0.1-fingerprint",
    completedDescription: "Fingerprinted",
});

export const AutofixGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "0.2-autofix",
    completedDescription: "Autofixes OK",
    failedDescription: "Fixes made: Don't proceed",
});

export const ReviewGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1-review",
    completedDescription: "Code review passed",
});

export const CodeReactionGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "1.5-react",
    completedDescription: "Code reactions",
});

/**
 * Just build, without any checks
 * @type {Goal}
 */
export const JustBuildGoal = new Goal({
    environment: IndependentOfEnvironment,
    orderedName: "2-build ",
    workingDescription: "Building...",
    completedDescription: "Build successful",
});

export const BuildGoal = new GoalWithPrecondition({
    environment: IndependentOfEnvironment,
    orderedName: "2-build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
}, AutofixGoal);

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

export const ProductionDeploymentGoal = new GoalWithPrecondition({
    environment: ProductionEnvironment,
    orderedName: "3-prod-deploy",
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod",
},
ArtifactGoal, StagingVerifiedGoal);

export const ProductionUndeploymentGoal = new Goal({
    environment: ProductionEnvironment,
    orderedName: "10-prod-undeploy",
    displayName: "undeploy from Prod",
    completedDescription: "not deployed in Prod",
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
    AutofixGoal,
    ReviewGoal,
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
    ProductionUndeploymentGoal,
];

export const StagingDeploymentContext = StagingDeploymentGoal.context;
export const StagingEndpointContext = StagingEndpointGoal.context;
export const StagingVerifiedContext = StagingVerifiedGoal.context;
export const ProductionDeploymentContext = ProductionDeploymentGoal.context;
export const ProductionEndpointContext = ProductionEndpointGoal.context;
export const ReviewContext = ReviewGoal.context;
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
export const NoGoals = new Goals(
    "No action needed",
    NoGoal);
