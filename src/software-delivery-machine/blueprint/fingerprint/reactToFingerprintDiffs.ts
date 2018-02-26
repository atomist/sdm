import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { FingerprintDifference } from "../../../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";

export function diff1(id: GitHubRepoRef, diff: FingerprintDifference[], ctx: HandlerContext) {
    console.log(JSON.stringify(diff));
    console.log("HAHA HA diff on " + JSON.stringify(id) + " of " + diff.map(d => d.newValue.name).join(","));
}
