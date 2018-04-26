import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { RepoListenerInvocation, SdmListener } from "./Listener";

export interface ReviewInvocation extends RepoListenerInvocation {

    /**
     * Consolidated review
     */
    review: ProjectReview;
}

/**
 * Listener invoked when a review has been completed.
 * Listeners will be invoked even in the case of a clean review,
 * without errors or comments.
 */
export type ReviewListener = SdmListener<ReviewInvocation>;
