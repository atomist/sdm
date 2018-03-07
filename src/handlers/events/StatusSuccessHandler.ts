import { HandleEvent } from "@atomist/automation-client";
import { Goals } from "../../common/goals/Goal";
import { OnAnySuccessStatus } from "../../typings/types";

/**
 * Atomist event handler for a GitHub status success event
 */
export interface StatusSuccessHandler extends HandleEvent<OnAnySuccessStatus.Subscription> {

    /**
     * If all phases are needed
     */
    phases?: Goals;

}
