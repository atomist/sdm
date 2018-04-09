/**
 * Can be implemented by editor parameters that can suggest EditMode to present them
 */
export interface EditModeSuggestion {

    desiredBranchName: string;

    desiredPullRequestTitle?: string;

    desiredCommitMessage?: string;

}
