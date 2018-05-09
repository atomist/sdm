import { CreatePendingGitHubStatusOnGoalSet, SetGitHubStatusOnGoalCompletion } from "../../common/delivery/goals/summarizeGoalsInGitHubStatus";
import {SoftwareDeliveryMachine} from "../SoftwareDeliveryMachine";

export function summarizeGoalsInGitHubStatus(sdm: SoftwareDeliveryMachine): SoftwareDeliveryMachine {
    sdm.addGoalsSetListeners(CreatePendingGitHubStatusOnGoalSet(sdm.opts.credentialsResolver));
    sdm.addGoalCompletionListeners(SetGitHubStatusOnGoalCompletion());
    return sdm;
}
