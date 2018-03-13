import { HandlerContext } from "@atomist/automation-client";
import "mocha";
import * as assert from "power-assert";
import { executeDeployArtifact, runWithLog } from "../../../../../src/handlers/events/delivery/deploy/executeDeploy";
import {
    ExecuteGoalOnSuccessStatus,
} from "../../../../../src/handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
} from "../../../../../src/handlers/events/delivery/goals/httpServiceGoals";

describe("the local deploy", () => {

    it("does not go when artifact is not done", () => {
        const deployHandler = new ExecuteGoalOnSuccessStatus("retryMe", ProductionDeploymentGoal,
            runWithLog(executeDeployArtifact({
                deployGoal: ProductionDeploymentGoal,
                endpointGoal: ProductionEndpointGoal,
                artifactStore: null,
                deployer: null,
                targeter: null,
            })));
        const handleResult = deployHandler.handle(buildSuccessEvent as any, {} as HandlerContext, deployHandler);

        return handleResult.then(res => {
            assert.equal(res.code, 0);
        });
    });
});

const buildSuccessEvent = {
    data: {
        Status: [{
            commit: {
                image: null,
                message: "change java",
                pushes: [{branch: "master"}],
                repo: {
                    channels: [{id: "T1JVCMVH7_C9HLGUSGG", name: "cezanne"}],
                    defaultBranch: "master",
                    name: "cezanne",
                    org: {chatTeam: {id: "T1JVCMVH7"}},
                    owner: "satellite-of-love",
                },
                sha: "4fbf994d25eb9114fc4ed8b5c6b2646c9a9f24cb",
                statuses: [{
                    context: "sdm/atomist/1-staging/3-deploy",
                    description: "Planning to deploy to Test",
                    state: "pending",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/0-code/2.5-artifact",
                    description: "Planning to store artifact",
                    state: "pending",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/2-prod/4-endpoint",
                    description: "Planning to locate service endpoint in Prod",
                    state: "pending",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/2-prod/3-prod-deploy",
                    description: "Planning to deploy to Prod",
                    state: "pending",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/0-code/2-build",
                    description: "Build successful",
                    state: "success",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/0-code/1-scan",
                    description: "Code scan passed",
                    state: "success",
                    targetUrl: "https://scan.atomist.com/satellite-of-love/cezanne/4fbf994d25eb9114fc4ed8b5c6b2646c9a9f24cb?atomist:approve=true",
                }, {
                    context: "sdm/atomist/1-staging/4-endpoint",
                    description: "Planning to locate service endpoint in Test",
                    state: "pending",
                    targetUrl: "",
                }, {
                    context: "sdm/atomist/1-staging/5-verifyEndpoint",
                    description: "Planning to verify Test deployment",
                    state: "pending",
                    targetUrl: "",
                }],
            }, context: "sdm/atomist/0-code/2-build", description: "Build successful", state: "success", targetUrl: "",
        }],
    },
    extensions: {
        operationName: "DeployFromLocalOnSuccessStatus1",
        team_id: "T1JVCMVH7",
        team_name: "satellite-of-love",
        correlation_id: "4889f9d3-9021-4088-a47d-b76eae060cc4",
    },
    api_version: "1",
    secrets: [{uri: "github://org_token", value: "7**************************************3"}],
};
