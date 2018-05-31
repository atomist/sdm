import { MachineConfiguration } from "../MachineConfiguration";
import { SoftwareDeliveryMachineOptions } from "../SoftwareDeliveryMachineOptions";

export type MachineOrMachineOptions = MachineConfiguration<any> | SoftwareDeliveryMachineOptions;

export function toMachineOptions(m: MachineOrMachineOptions): SoftwareDeliveryMachineOptions {
    return isMachineConfiguration(m) ?
        m.options :
        m;
}

function isMachineConfiguration(o: object): o is MachineConfiguration<any> {
    const maybe = o as MachineConfiguration<any>;
    return !!maybe.options && !!maybe.configuration;
}
