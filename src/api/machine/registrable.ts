import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

export interface Registrable {
    register(sdm: SoftwareDeliveryMachine): void;
}

class RegistrableManager implements Registrable {

    public readonly registrables: Registrable[] = [];
    public sdm: SoftwareDeliveryMachine;

    public addRegistrable(registrable: Registrable): void {
        if (this.sdm) {
            registrable.register(this.sdm);
        } else {
            this.registrables.push(registrable);
        }
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        this.registrables.forEach(r => r.register(sdm));
        this.sdm = sdm;
    }
}

(global as any).__registrable = new RegistrableManager();

export function registrableManager(): Registrable {
    return (global as any).__registrable;
}

export function registerRegistrable(registrable: Registrable): void {
    (registrableManager() as any).addRegistrable(registrable);
}