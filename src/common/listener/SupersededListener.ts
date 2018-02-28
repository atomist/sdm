
import * as schema from "../../typings/types";
import { ListenerInvocation, SdmListener } from "./Listener";

export interface SupersededListenerInvocation extends ListenerInvocation {

    status: schema.OnSupersededStatus.Status;
}

export type SupersededListener = SdmListener<SupersededListenerInvocation>;
