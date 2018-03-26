import { Goals } from "../../../../common/delivery/goals/Goals";
import { HandlerContext } from "@atomist/automation-client";
import { Goal, GoalWithPrecondition } from "../../../../common/delivery/goals/Goal";
import { splitContext } from "../../../../common/delivery/goals/gitHubContext";

export async function showGraph(ctx: HandlerContext, goals: Goals) {
    // This is an easter egg at this point
    const graphvizServiceUrl = process.env.GRAPHVIZ_SERVICE_URL;
    if (!graphvizServiceUrl) {
        return;
    }

    const graphDefinition = goalsToDot(goals)
}

function goalsToDot(goals: Goals) {

    const nodeAttributes = goals.goals.map(g =>
        `${validDotName(g)} [label="${g.name}"]`);

    const edges: string[][] = goals.goals.map(g => {
        const precursors = (g as GoalWithPrecondition).dependsOn || [];
        return precursors.map(p => `${validDotName(p)} -> ${validDotName(g)}`)
    });

    const edgeAttributes = _.flatten(edges);

    return `digraph ${goals.name} {
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

function validDotName(g: Goal) {
    const parts = splitContext(g.context);
    const startAtName = parts.env + "_" + parts.goalName;
    return startAtName.replace(/[-\s.]/g, "_");
}
