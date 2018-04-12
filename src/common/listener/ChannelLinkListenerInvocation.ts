import { AddressChannels } from "../slack/addressChannels";
import { ProjectListenerInvocation, SdmListener } from "./Listener";

export interface ChannelLinkListenerInvocation extends ProjectListenerInvocation {

    newlyLinkedChannelName: string;

    /**
     * Convenient method to address the newly linked channel only.
     * The inherited addressChannels method will address all linked channels.
     */
    addressNewlyLinkedChannel: AddressChannels;

}

export type ChannelLinkListener = SdmListener<ChannelLinkListenerInvocation>;
