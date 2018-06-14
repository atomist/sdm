import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Extended by types that know how to configure an existing SDM.
 * The SDM's configuration will be valid and can be accessed in
 * the implementation of the configure method.
 */
export interface MachineConfigurer {

    /**
     * Function to configure the given SDM
     * @param sdm
     */
    configure(sdm: SoftwareDeliveryMachine): void;

}
