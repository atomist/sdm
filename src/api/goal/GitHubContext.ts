
// convention: "sdm/atomist/#-env/#-goal" (the numbers are for ordering)
import { StatusState } from "../../typings/types";

export type GitHubStatusContext = string;

export interface GitHubStatus {
    context?: GitHubStatusContext;
    description?: string;
    state?: StatusState;
    targetUrl?: string;
}

export interface GitHubStatusAndFriends extends GitHubStatus {
    siblings: GitHubStatus[];
}

export const BaseContext = "sdm/atomist/";