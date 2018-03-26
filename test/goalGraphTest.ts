import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import "mocha";
import * as assert from "power-assert";
import { HttpServiceGoals } from "../src/common/delivery/goals/common/httpServiceGoals";
import { splitContext } from "../src/common/delivery/goals/gitHubContext";
import { Goal, GoalWithPrecondition } from "../src/common/delivery/goals/Goal";
import { Goals } from "../src/common/delivery/goals/Goals";
import { goalsToDot } from "../src/handlers/events/delivery/goals/graphGoals";

const DesiredDot = `digraph HTTP_Service {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
    node [shape=box, fontname="Arial", style="rounded"];

    code_fingerprint [label="fingerprint"]
    code_autofix [label="autofix"]
    code_review [label="review"]
    code_react [label="react"]
    code_build [label="build"]
    code_artifact [label="store artifact"]
    staging_deploy [label="deploy to Test"]
    staging_endpoint [label="locate service endpoint in Test"]
    staging_verifyEndpoint [label="verify Test deployment"]
    prod_prod_deploy [label="deploy to Prod"]
    prod_endpoint [label="locate service endpoint in Prod"]

    code_autofix -> code_build
    code_build -> staging_deploy
    code_artifact -> prod_prod_deploy
    staging_verifyEndpoint -> prod_prod_deploy
}
`;

describe("Rendering a goal graph", () => {
    it("renders the HTTP Service Goals", () => {
        const goals = HttpServiceGoals;

        const dot = goalsToDot(goals);
        console.log(dot);
        assert.equal(dot, DesiredDot);
    });
});
