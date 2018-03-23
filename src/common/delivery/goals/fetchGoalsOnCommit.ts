import { HandlerContext, logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SdmGoalsForCommit } from "../../../typings/types";

export async function fetchGoalsForCommit(ctx: HandlerContext, id: GitHubRepoRef, providerId: string): Promise<SdmGoalsForCommit.SdmGoal[]> {
    const result = await ctx.graphClient.query<SdmGoalsForCommit.Query, SdmGoalsForCommit.Variables>({
        name: "SdmGoalsForCommit", variables: {
            owner: id.owner,
            repo: id.repo,
            branch: id.branch,
            sha: id.sha,
            providerId,
        },
    });
    if (!result || !result.SdmGoal) {
        throw new Error(`No result finding goals for commit ${providerId}/${id.owner}/${id.repo}#${id.sha} on ${id.branch}`);
    }
    if (result.SdmGoal.length === 0) {
        logger.warn("0 goals found for commit %j, provider %s", id, providerId);
    }

    return result.SdmGoal;
}
