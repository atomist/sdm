import { HandlerContext, logger } from "@atomist/automation-client";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as https from "https";
import { LastEndpoint } from "../typings/types";

const K8TargetBase = "deploy/atomist/k8s/";

export async function findLastK8sDeployment(ctx: HandlerContext, rr: RepoRef,
                                            branch: string, environment: string) {
    const result = await ctx.graphClient.executeQueryFromFile<LastEndpoint.Query, LastEndpoint.Variables>(
        "graphql/query/LastEndpoint", {
            name: rr.repo,
            owner: rr.owner,
            branch,
            statusContext: K8TargetBase + environment,
        });
    if (!result || !result.Repo[0]) {
        throw new Error(`No commit found on ${rr.owner}/${rr.repo}#${branch}`);
    }
    const commit = result.Repo[0].branches[0].commit;
    logger.debug(`Found a commit for ${rr.owner}/${rr.repo}#${branch}: ${commit.sha}`);
    const statuses = commit.statuses;
    if (!statuses || statuses.length === 0) {
        throw new Error(`No commit found on ${rr.owner}/${rr.repo}#${branch}`);
    }
    const endpointStatus = statuses[0];
    if (endpointStatus.state !== "success") {
        throw new Error(`The k8s deployment on ${commit.sha} was not successful`);
    }
    return endpointStatus.targetUrl;
}

export const notPicky = {
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
};
