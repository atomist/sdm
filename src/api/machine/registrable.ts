import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

export interface Registrable {
    register(sdm: SoftwareDeliveryMachine): void;
}

export class RegistrableManager implements Registrable {

    public readonly registrables: Registrable[] = [];

    public register(sdm: SoftwareDeliveryMachine): void {
        this.registrables.forEach(r => r.register(sdm));
    }
}

(global as any).__registrable = new RegistrableManager();

export function registrableManager() {
    return (global as any).__registrable;
}

export function registerRegistrable(registrable: Registrable): void {
        registrableManager().registrables.push(registrable);
}