import "mocha";
import * as assert from "power-assert";
import { Goals } from "../src";
import { HttpServiceGoals } from "../src/handlers/events/delivery/goals/httpServiceGoals";

function goalsToDot(goals: Goals, name: string) {


    return `digraph ${name} {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
}
`
}

const DesiredDot = `digraph HttpServiceGoals {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
}
`;

describe("Rendering a goal graph", () => {
    it("renders the HTTP Service Goals", () => {
        const goals = HttpServiceGoals;

        const dot = goalsToDot(goals, "HttpServiceGoals");
        assert.equal(DesiredDot, dot);
    })
});