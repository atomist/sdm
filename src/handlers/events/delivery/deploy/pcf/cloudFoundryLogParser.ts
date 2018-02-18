
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { isPatternMatch } from "@atomist/microgrammar/PatternMatch";
import { DeploymentInfo } from "../Deployment";

/**
 * Use a microgrammar to parse the Cloud Foundry log to extract the endpoint
 * url if found
 * @param {string} cfLog
 * @return {DeploymentInfo}
 */
export function parseCloudFoundryLog(cfLog: string): DeploymentInfo {
    const r = mg.firstMatch(cfLog);
    if (isPatternMatch(r)) {
        let endpoint = r.endpoint;
        if (!endpoint.startsWith("http://")) {
            endpoint = "http://" + r.endpoint;
        }
        return {
            endpoint,
        };
    }
    return undefined;
}

const mg = Microgrammar.fromString<DeploymentInfo>(
    "urls:${endpoint}",
    {
        endpoint: /[http:\/\/]?[a-zA-Z0-9\-.]+/,
    },
);
