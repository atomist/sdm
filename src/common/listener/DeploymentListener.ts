/**
 * React to a successful deployment
 */
import { OnSuccessStatus } from "../../typings/types";
import { ListenerInvocation, SdmListener } from "./Listener";
import Status = OnSuccessStatus.Status;

export interface DeploymentEventListener extends ListenerInvocation {

    status: Status;

}

export type DeploymentListener = SdmListener<DeploymentEventListener>;
