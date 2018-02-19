import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { isPatternMatch } from "@atomist/microgrammar/PatternMatch";

/**
 * Use a microgrammar to parse the Cloud Foundry log to extract the endpoint
 * url if found
 * @param {string} cfLog
 * @return {DeploymentInfo}
 */
export function parseCloudFoundryLogForEndpoint(cfLog: string): string | undefined {
    const r = mg.firstMatch(cfLog);
    if (isPatternMatch(r)) {
        if (!r.endpoint.startsWith("http://")) {
            return "http://" + r.endpoint;
        }
        return r.endpoint;
    }
    return undefined;
}

const mg = Microgrammar.fromString<{endpoint: string}>(
    "urls:${endpoint}",
    {
        endpoint: /[http:\/\/]?[a-zA-Z0-9\-.]+/,
    },
);
