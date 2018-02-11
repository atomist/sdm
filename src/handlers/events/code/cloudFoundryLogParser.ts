
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { isPatternMatch } from "@atomist/microgrammar/PatternMatch";

export interface DeploymentInfo {
    endpoint: string;
}

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
