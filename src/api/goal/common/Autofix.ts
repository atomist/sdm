import { executeAutofixes } from "../../../api-helper/listener/executeAutofixes";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { AutofixGoal } from "../../machine/wellKnownGoals";
import { AutofixRegistration } from "../../registration/AutofixRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that performs autofixes: For example, linting and adding license headers.
 */
export class Autofix extends FulfillableGoalWithRegistrations<AutofixRegistration> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...AutofixGoal.definition,
            uniqueName,
            orderedName: `0.2-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `Autofix-${this.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeAutofixes(
                this.sdm.configuration.sdm.projectLoader,
                this.registrations,
                this.sdm.configuration.sdm.repoRefResolver),
        });
    }
}
