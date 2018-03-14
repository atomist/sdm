import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { isPatternMatch } from "@atomist/microgrammar/PatternMatch";

/**
 * Use a microgrammar to parse the Cloud Foundry log to extract the endpoint
 * url if found. Look for urls: or routes: style exposure in log.
 */
export function parseCloudFoundryLogForEndpoint(cfLog: string): string | undefined {
    const r = routes.firstMatch(cfLog) || urls.firstMatch(cfLog);
    if (isPatternMatch(r)) {
        if (!r.endpoint.startsWith("http://")) {
            return "http://" + r.endpoint;
        }
        return r.endpoint;
    }
    return undefined;
}

// The cf cli changed from returning urls to routes in a recent version
const routes = Microgrammar.fromString<{endpoint: string}>(
    "routes:${endpoint}",
    {
        endpoint: /[http:\/\/]?[a-zA-Z0-9\-.]+/,
    },
);

// Old style urls value
const urls = Microgrammar.fromString<{endpoint: string}>(
    "urls:${endpoint}",
    {
        endpoint: /[http:\/\/]?[a-zA-Z0-9\-.]+/,
    },
);
