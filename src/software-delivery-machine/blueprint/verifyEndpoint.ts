import { VerifyOnEndpointStatus } from "../../handlers/events/delivery/VerifyOnEndpointStatus";

export const VerifyEndpoint = new VerifyOnEndpointStatus(
    url => {
        return Promise.resolve();
    },
);
