/**
 * Context allowing us to communicate with an admin
 */
export interface AdminCommunicationContext {

    /**
     * Address the admin of this SDM
     * @param {string} message
     * @param args
     * @return {Promise<any>}
     */
    addressAdmin(message: string, ...args: any[]): Promise<any>;
}
