import { doWithRetry, RetryOptions } from "@atomist/automation-client/util/retry";
import axios from "axios";
import * as https from "https";
import { EndpointVerificationInvocation, EndpointVerificationListener, OnEndpointStatus } from "../OnEndpointStatus";

/**
 * Make an HTTP request to the reported endpoint to check
 * @type {OnEndpointStatus}
 */
export function lookFor200OnEndpointRootGet(retryOpts: Partial<RetryOptions> = {}): EndpointVerificationListener {
    return (inv: EndpointVerificationInvocation) => {
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });
        return doWithRetry(
            () => axios.get(inv.url, {httpsAgent: agent})
                .then(resp => {
                    console.log(resp.status);
                    if (resp.status !== 200) {
                        return Promise.reject(`Unexpected response: ${resp.status}`);
                    }
                    return Promise.resolve();
                }),
            `Try to connect to ${inv.url}`,
            retryOpts);
        // Let a failure go through
    };
}
