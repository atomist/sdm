import axios from "axios";
import { EndpointVerificationInvocation, EndpointVerificationListener, OnEndpointStatus } from "../OnEndpointStatus";
import * as https from "https";

/**
 * Make an HTTP request to the reported endpoint to check
 * @type {OnEndpointStatus}
 */
export const LookFor200OnEndpointRootGet: EndpointVerificationListener =
    (inv: EndpointVerificationInvocation) => {
        const agent = new https.Agent({
           rejectUnauthorized: false
        });
        return axios.get(inv.url, {httpsAgent: agent})
            .then(resp => {
                console.log(resp.status)
                if (resp.status !== 200) {
                    return Promise.reject(`Unexpected response: ${resp.status}`);
                }
                return Promise.resolve();
            });
        // Let a failure go through
    };
