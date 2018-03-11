import "mocha";
import * as assert from "power-assert";
import { Goals } from "../src";
import { HttpServiceGoals } from "../src/handlers/events/delivery/goals/httpServiceGoals";
import { Goal } from "../src/common/goals/Goal";
import { splitContext } from "../src/common/goals/gitHubContext";

function goalsToDot(goals: Goals, name: string) {

    const nodeAttributes = goals.goals.map(g =>
    `${validDotName(g)} [label="${g.name}"]`);


    return `digraph ${name} {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
    node [shape=box, fontname="Arial", style="rounded"];

    ${nodeAttributes.join("\n    ")}
}
`
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