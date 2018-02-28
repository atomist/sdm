import { Destination } from "@atomist/automation-client/spi/message/MessageClient";
import { StatusState } from "../../typings/types";
import { ListenerInvocation, SdmListener } from "./Listener";

export interface StatusInfo {
    state?: StatusState | null;
    targetUrl?: string | null;
    context?: string | null;
}

/**
 * Represents a verified deployment
 */
export interface VerifiedDeploymentInvocation extends ListenerInvocation {
    status: StatusInfo;
    messageDestination: Destination;
}

export type VerifiedDeploymentListener = SdmListener<VerifiedDeploymentInvocation>;
