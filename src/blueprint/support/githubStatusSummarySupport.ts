import {SoftwareDeliveryMachine} from "../SoftwareDeliveryMachine";
import { CreatePendingGitHubStatusOnGoalSet, SetGitHubStatusOnGoalCompletion } from "../../common/delivery/goals/summarizeGoalsInGitHubStatus";

export function summarizeGoalsInGitHubStatus(sdm: SoftwareDeliveryMachine): SoftwareDeliveryMachine {
    sdm.addGoalsSetListeners(CreatePendingGitHubStatusOnGoalSet(sdm.opts.credentialsResolver));
    sdm.addGoalCompletionListeners(SetGitHubStatusOnGoalCompletion(sdm.opts.credentialsResolver));
    return sdm;
}
