
import axios from "axios";
import { VerifyOnEndpointStatus } from "../../../handlers/events/delivery/verify/VerifyOnEndpointStatus";

/**
 * Make an HTTP request to the report endpoint to check
 * @type {VerifyOnEndpointStatus}
 */
export const VerifyEndpoint = () => new VerifyOnEndpointStatus(
    url => {
        return axios.get(url)
            .then(resp => {
                if (resp.status !== 200) {
                    return Promise.reject(`Unexpected response: ${resp.status}`);
                }
                return Promise.resolve();
            });
            // Let a failure go through
    },
);
