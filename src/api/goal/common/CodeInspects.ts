import { executeAutoInspects } from "../../../api-helper/listener/executeAutoInspects";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { CodeInspectionGoal } from "../../machine/wellKnownGoals";
import { CodeInspectionRegistration } from "../../registration/CodeInspectionRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that runs code inspections
 */
export class CodeInspects extends FulfillableGoalWithRegistrations<CodeInspectionRegistration<any>> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...CodeInspectionGoal.definition,
            uniqueName,
            orderedName: `1-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `Inspect-${this.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor:  executeAutoInspects(
                this.sdm.configuration.sdm.projectLoader,
                this.registrations,
                this.sdm.reviewListenerRegistrations),
        });
    }
}
