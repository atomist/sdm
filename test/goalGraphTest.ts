import "mocha";
import * as assert from "power-assert";
import { Goals } from "../src";
import { HttpServiceGoals } from "../src/handlers/events/delivery/goals/httpServiceGoals";
import { Goal, GoalWithPrecondition } from "../src/common/goals/Goal";
import { splitContext } from "../src/common/goals/gitHubContext";
import * as _ from "lodash";
import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";

function goalsToDot(goals: Goals, name: string) {

    const nodeAttributes = goals.goals.map(g =>
    `${validDotName(g)} [label="${g.name}"]`);

    const edges: string[][] = goals.goals.map(g => {
        const precursors = (g as GoalWithPrecondition).dependsOn || [] // guessPreviousGoals(goals, g);
        return precursors.map(p => `${validDotName(p)} -> ${validDotName(g)}`)
    });

    const edgeAttributes = _.flatten(edges)


    return `digraph ${name} {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
    node [shape=box, fontname="Arial", style="rounded"];

    ${nodeAttributes.join("\n    ")}

    ${edgeAttributes.join("\n    ")}
}
`
}

function guessPreviousGoals(expectedGoals: Goals, currentGoal: Goal) {
    const whereAmI = expectedGoals.goals.indexOf(currentGoal);
    if (whereAmI < 0) {
        logger.warn(`Inconsistency! Goal ${currentGoal} is known but is not part of Goals ${stringify(expectedGoals)}`);
        return [];
    }
    if (whereAmI === 0) {
        logger.info(`${currentGoal} is the first step.`);
        return [];
    }
    return [expectedGoals.goals[whereAmI - 1]];

}

function validDotName(g: Goal) {
    const parts = splitContext(g.context);
    const startAtName = parts.env + "_" + parts.goalName;
    return startAtName.replace(/[-\s.]/g, "_");
}

const DesiredDot = `digraph HttpServiceGoals {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
    node [shape=box, fontname="Arial", style="rounded"];

    code_scan [label="scan"]
    code_build [label="build"]
    code_artifact [label="store artifact"]
    staging_deploy [label="deploy to Test"]
    staging_endpoint [label="locate service endpoint in Test"]
    staging_verifyEndpoint [label="verify Test deployment"]
    prod_prod_deploy [label="deploy to Prod"]
    prod_endpoint [label="locate service endpoint in Prod"]

    code_scan -> code_build
    code_build -> code_artifact
    code_artifact -> staging_deploy
    staging_deploy -> staging_endpoint
    staging_endpoint -> staging_verifyEndpoint
    staging_verifyEndpoint -> prod_prod_deploy
    prod_prod_deploy -> prod_endpoint
}
`;

describe("Rendering a goal graph", () => {
    it("renders the HTTP Service Goals", () => {
        const goals = HttpServiceGoals;

        const dot = goalsToDot(goals, "HttpServiceGoals");
        console.log(dot);
        assert.equal(DesiredDot, dot);
    })
});