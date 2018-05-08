import {SoftwareDeliveryMachine} from "../SoftwareDeliveryMachine";
import {CreatePendingGitHubStatusOnGoalSet} from "../..";


export function summarizeGoalsInGitHubStatus(sdm: SoftwareDeliveryMachine): SoftwareDeliveryMachine {
    sdm.addGoalsSetListeners(CreatePendingGitHubStatusOnGoalSet(sdm.opts.credentialsResolver));
    return sdm;
}