import { HandleEvent } from "@atomist/automation-client";
import { OnAnySuccessStatus } from "../../typings/types";
import { Phases } from "./delivery/Phases";

/**
 * Handler for a status success event
 */
export interface StatusSuccessHandler extends HandleEvent<OnAnySuccessStatus.Subscription> {

    ourContext: string;

    /**
     * If all phases are needed
     */
    phases?: Phases;

}
