import { HandlerContext } from "@atomist/automation-client";
import { ScmProvider } from "../../typings/types";


export const GitHubDotComProviderId = "zjlmxjzwhurspem";


export async function fetchProvider(context: HandlerContext, providerId: string): Promise<ScmProvider.ScmProvider> {

    const results = await context.graphClient.query<ScmProvider.Query, ScmProvider.Variables>(
        {name: "SCMProvider", variables: {providerId}});

    if (!results || !results.SCMProvider || results.SCMProvider.length === 0) {
        throw new Error("Provider not found: " + providerId);
    }

    return results.SCMProvider[0];

}