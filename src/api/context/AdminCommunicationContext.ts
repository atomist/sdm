/**
 * Context allowing us to communicate with an admin
 */
import { AddressChannels } from "./addressChannels";

export interface AdminCommunicationContext {

    /**
     * Address the admin of this SDM
     * @param {string} message
     * @param args
     * @return {Promise<any>}
     */
    addressAdmin: AddressChannels;
}
