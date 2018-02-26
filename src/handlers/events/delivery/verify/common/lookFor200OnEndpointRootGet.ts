import axios from "axios";
import { EndpointVerificationInvocation, EndpointVerificationListener, OnEndpointStatus } from "../OnEndpointStatus";

/**
 * Make an HTTP request to the reported endpoint to check
 * @type {OnEndpointStatus}
 */
export const LookFor200OnEndpointRootGet: EndpointVerificationListener =
    (inv: EndpointVerificationInvocation) => {
        return axios.get(inv.url)
            .then(resp => {
                if (resp.status !== 200) {
                    return Promise.reject(`Unexpected response: ${resp.status}`);
                }
                return Promise.resolve();
            });
        // Let a failure go through
    };
