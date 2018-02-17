import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    FingerprintDifference,
    ReactToSemanticDiffsOnPushImpact,
} from "../../../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";

export const SemanticDiffReactor = () => new ReactToSemanticDiffsOnPushImpact([diff1]);

function diff1(id: GitHubRepoRef, diff: FingerprintDifference[], ctx: HandlerContext) {
    console.log("HAHA HA diff on " + JSON.stringify(id) + " of " + diff.map(d => d.newValue.name).join(","));
}
