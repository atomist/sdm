import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Configuration function that can added in SoftwareDeliveryMachine.addCapabilities.
 * Facilitates modularity at a higher level than FunctionUnit or handlers.
 * For example, a Node module can export a configurer.
 */
export interface SoftwareDeliveryMachineConfigurer {
    name: string;
    configure(sdm: SoftwareDeliveryMachine): void;
}
