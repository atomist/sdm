
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { isPatternMatch } from "@atomist/microgrammar/PatternMatch";

export interface DeploymentInfo {
    endpoint: string;
}

/**
 * Use a microgrammar to parse the Cloud Foundry log to extract the endpoint
 * url if found
 * @param {string} cfLog
 * @return {DeploymentInfo}
 */
export function parseCloudFoundryLog(cfLog: string): DeploymentInfo {
    const r = mg.firstMatch(cfLog);
    if (isPatternMatch(r)) {
        if (!r.endpoint.startsWith("http://")) {
            r.endpoint = "http://" + r.endpoint;
        }
        return r;
    }
    return undefined;
}

const mg = Microgrammar.fromString<DeploymentInfo>(
    "urls:${endpoint}",
    {
        endpoint: /[http:\/\/]?[a-zA-Z0-9\-.]+/,
    },
);
