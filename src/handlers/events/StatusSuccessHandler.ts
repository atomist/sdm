import { HandleEvent } from "@atomist/automation-client";
import { OnAnySuccessStatus } from "../../typings/types";
import { Phases } from "./delivery/Phases";

/**
 * Atomist event handler for a GitHub status success event
 */
export interface StatusSuccessHandler extends HandleEvent<OnAnySuccessStatus.Subscription> {

    /**
     * If all phases are needed
     */
    phases?: Phases;

}
