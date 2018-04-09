
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { CodeActionRegistration } from "../CodeActionRegistration";

export interface ReviewerRegistrationOptions {

    /**
     * Run only on affected files?
     */
    reviewOnlyChangedFiles: boolean;
}

export interface ReviewerRegistration extends CodeActionRegistration<ProjectReview> {

    options?: ReviewerRegistrationOptions;
}
