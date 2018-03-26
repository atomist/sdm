import { HandlerContext, logger } from "@atomist/automation-client";
import axios from "axios";
import * as _ from "lodash";
import { splitContext } from "../../../../common/delivery/goals/gitHubContext";
import { Goal, GoalWithPrecondition } from "../../../../common/delivery/goals/Goal";
import { Goals } from "../../../../common/delivery/goals/Goals";
import { AddressChannels } from "../../../../common/slack/addressChannels";

export async function showGraph(ctx: HandlerContext, addressChannels: AddressChannels, goals: Goals) {
    // This is an easter egg
    const graphvizServiceUrl = process.env.GRAPHVIZ_SERVICE_URL;
    if (!graphvizServiceUrl) {
        return;
    }

    try {
        const graphDefinition = goalsToDot(goals);

        const generateGraphUrl = graphvizServiceUrl + "/dot/png";
        const generateGraphResponse = await axios.post(generateGraphUrl,
            graphDefinition,
            {headers: {"Content-Type": "text/plain"}});
        logger.debug("ShowGraph: got from %s: %j", generateGraphUrl, generateGraphResponse);

        const graphImageRelativePath = generateGraphResponse.data.goalGraphUrl;
        if (!graphImageRelativePath) {
            logger.info("ShowGraph: No image path returned from graphvizService");
            return;
        }

        return addressChannels("Goal dependency graph for " + graphvizServiceUrl + "/" + graphImageRelativePath);
    } catch (err) {
        // do not fail anything
        logger.error("Unable to generate a cool graph of the goals: " + err.message);
        logger.error("stack trace: " + err.stack);
    }

}

export function goalsToDot(goals: Goals) {

    const nodeAttributes = goals.goals.map(g =>
        `${validDotName(g)} [label="${g.name}"]`);

    const edges: string[][] = goals.goals.map(g => {
        const precursors = (g as GoalWithPrecondition).dependsOn || [];
        return precursors.map(p => `${validDotName(p)} -> ${validDotName(g)}`);
    });

    const edgeAttributes = _.flatten(edges);

    return `digraph ${validDotIdentifier(goals.name)} {
    fontname="Arial";
    splines="polyline";
    rankdir="LR";
    edge [arrowhead="vee"];
    node [shape=box, fontname="Arial", style="rounded"];

    ${nodeAttributes.join("\n    ")}

    ${edgeAttributes.join("\n    ")}
}
`;
}

function validDotName(g: Goal) {
    const parts = splitContext(g.context);
    const startAtName = parts.env + "_" + parts.goalName;
    return validDotIdentifier(startAtName);
}

function validDotIdentifier(s: string): string {
    return s.replace(/[-\s.]/g, "_");
}
