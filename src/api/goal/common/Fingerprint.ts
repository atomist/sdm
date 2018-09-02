import { executeFingerprinting } from "../../../api-helper/listener/executeFingerprinting";
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { FingerprintGoal } from "../../machine/wellKnownGoals";
import { FingerprinterRegistration } from "../../registration/FingerprinterRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that performs fingerprinting. Typically invoked early in a delivery flow.
 */
export class Fingerprint extends FulfillableGoalWithRegistrations<FingerprinterRegistration> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...FingerprintGoal.definition,
            uniqueName,
            orderedName: `0.1-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `Fingerprint-${this.uniqueName}`,
            goalExecutor: executeFingerprinting(
                this.sdm.configuration.sdm.projectLoader,
                this.registrations,
                this.sdm.fingerprintListeners),
        });
    }
}
