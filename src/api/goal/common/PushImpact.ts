import { executePushReactions } from "../../../api-helper/listener/executePushReactions";
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { PushReactionGoal } from "../../machine/wellKnownGoals";
import { PushImpactListenerRegistration } from "../../registration/PushImpactListenerRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that performs fingerprinting. Typically invoked early in a delivery flow.
 */
export class PushImpact extends FulfillableGoalWithRegistrations<PushImpactListenerRegistration> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...PushReactionGoal.definition,
            uniqueName,
            orderedName: `1.5-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `PushImpact-${this.uniqueName}`,
            goalExecutor: executePushReactions(
                this.sdm.configuration.sdm.projectLoader,
                this.sdm.pushImpactListenerRegistrations),
        });
    }
}
