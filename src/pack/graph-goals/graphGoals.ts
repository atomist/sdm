/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { configurationValue } from "@atomist/automation-client/configuration";
import * as slack from "@atomist/slack-messages/SlackMessages";
import axios from "axios";
import * as https from "https";
import * as _ from "lodash";
import { Goal, GoalWithPrecondition } from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import { GoalsSetListener } from "../../api/listener/GoalsSetListener";
import { splitContext } from "../../internal/delivery/goals/support/github/gitHubContext";

/**
 * Display a graph of the goals that have just been set to Slack
 * @param {GoalsSetListenerInvocation} gsi
 * @return {Promise<any>}
 * @constructor
 */
export const GraphGoals: GoalsSetListener = async gsi => {
    const graphvizServiceUrl = configurationValue<string>("sdm.graphviz.url", null);
    if (!graphvizServiceUrl) {
        return;
    }
    if (!gsi.goalSet) {
        return;
    }

    try {
        const graphDefinition = goalsToDot(gsi.goalSet);
        logger.debug("ShowGraph: generated .dot: " + graphDefinition);

        const generateGraphUrl = graphvizServiceUrl + "/dot/png";
        const generateGraphResponse = await askForGraph(generateGraphUrl, graphDefinition);

        const graphImageRelativePath = generateGraphResponse.goalGraphUrl;
        if (!graphImageRelativePath) {
            logger.info("ShowGraph: No image path returned from graphvizService");
            return;
        }

        const showGraphMessage: slack.SlackMessage = {
            attachments: [{
                fallback: "dependency goal graph goes here",
                text: "Graph of planned goal set: " + gsi.goalSet.name,
                image_url: graphvizServiceUrl + "/" + graphImageRelativePath,
            }],
        };
        return gsi.addressChannels(showGraphMessage);
    } catch (err) {
        // do not fail anything. The graphing service has an SLA of "good luck"
        logger.warn("ShowGraph: Unable to generate a cool graph of the goalSet: " + err.message);
        logger.warn("ShowGraph: URL: " + graphvizServiceUrl);
        logger.warn("ShowGraph: stack trace: " + err.stack);
    }

};

async function askForGraph(generateGraphUrl: string, graphDefinition: string) {
    const agent = new https.Agent({
        rejectUnauthorized: false,
    });
    const generateGraphResponse = await axios.post(generateGraphUrl,
        graphDefinition,
        {headers: {"Content-Type": "text/plain"}, httpsAgent: agent});
    logger.debug("ShowGraph: got from %s: %j", generateGraphUrl, generateGraphResponse);

    return generateGraphResponse.data;
}

export function goalsToDot(goals: Goals): string {
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
