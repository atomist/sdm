import { Destination } from "@atomist/automation-client/spi/message/MessageClient";
import { ProjectListenerInvocation } from "./Listener";

export interface ChannelLinkListenerInvocation extends ProjectListenerInvocation {

    newlyLinkedChannelName: string;

    newlyLinkedChannelDestination: Destination;

}
