import { CreatePendingGitHubStatusOnGoalSet, SetGitHubStatusOnGoalCompletion } from "../..";
import {SoftwareDeliveryMachine} from "../SoftwareDeliveryMachine";

export function summarizeGoalsInGitHubStatus(sdm: SoftwareDeliveryMachine): SoftwareDeliveryMachine {
    sdm.addGoalsSetListeners(CreatePendingGitHubStatusOnGoalSet(sdm.opts.credentialsResolver));
    sdm.addGoalCompletionListeners(SetGitHubStatusOnGoalCompletion(sdm.opts.credentialsResolver));
    return sdm;
}
