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

import { logger } from "@atomist/automation-client";
import * as slack from "@atomist/slack-messages/SlackMessages";
import axios from "axios";
import * as _ from "lodash";
import { GoalsSetListener } from "../../../listener/GoalsSetListener";
import { splitContext } from "../gitHubContext";
import { Goal, GoalWithPrecondition } from "../Goal";
import { Goals } from "../Goals";

export const GraphGoalsToSlack: GoalsSetListener = async gsi => {
    // This is an easter egg
    const graphvizServiceUrl = process.env.GRAPHVIZ_SERVICE_URL;
    if (!graphvizServiceUrl) {
        return;
    }
    if (!gsi.goals) {
        return;
    }

    try {
        const graphDefinition = goalsToDot(gsi.goals);
        logger.debug("ShowGraph: generated .dot: " + graphDefinition);

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

        const showGraphMessage: slack.SlackMessage = {
            attachments: [{
                fallback: "dependency goal graph goes here",
                text: "Graph of planned goals",
                image_url: graphvizServiceUrl + "/" + graphImageRelativePath,
            }],
        };
        return gsi.addressChannels(showGraphMessage);
    } catch (err) {
        // do not fail anything
        logger.error("ShowGraph: Unable to generate a cool graph of the goals: " + err.message);
        logger.error("ShowGraph: URL: " + graphvizServiceUrl);
        logger.error("ShowGraph: stack trace: " + err.stack);
    }

};

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
