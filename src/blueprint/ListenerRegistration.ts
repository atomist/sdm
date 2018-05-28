import { AutofixRegistration } from "../common/delivery/code/autofix/AutofixRegistration";
import { FingerprinterRegistration } from "../common/delivery/code/fingerprint/FingerprinterRegistration";
import { PushReactionRegisterable } from "../common/delivery/code/PushReactionRegistration";
import { ReviewerRegistration } from "../common/delivery/code/review/ReviewerRegistration";
import { ArtifactListenerRegisterable } from "../common/listener/ArtifactListener";
import { BuildListener } from "../common/listener/BuildListener";
import { ChannelLinkListener } from "../common/listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../common/listener/ClosedIssueListener";
import { DeploymentListener } from "../common/listener/DeploymentListener";
import { FingerprintDifferenceListener } from "../common/listener/FingerprintDifferenceListener";
import { FingerprintListener } from "../common/listener/FingerprintListener";
import { GoalCompletionListener, GoalsSetListener } from "../common/listener/GoalsSetListener";
import { NewIssueListener } from "../common/listener/NewIssueListener";
import { ProjectListener } from "../common/listener/ProjectListener";
import { PullRequestListener } from "../common/listener/PullRequestListener";
import { PushListener } from "../common/listener/PushListener";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";
import { ReviewListener } from "../common/listener/ReviewListener";
import { TagListener } from "../common/listener/TagListener";
import { UpdatedIssueListener } from "../common/listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../common/listener/UserJoiningChannelListener";
import { VerifiedDeploymentListener } from "../common/listener/VerifiedDeploymentListener";
import { EndpointVerificationListener } from "../handlers/events/delivery/verify/executeVerifyEndpoint";

/**
 * Listener management offering a fluent builder pattern for registrations.
 */
export interface ListenerRegistration {

    addNewIssueListeners(...e: NewIssueListener[]): this;

    addUpdatedIssueListeners(...e: UpdatedIssueListener[]);

    /**
     * These are invoked when a goal reaches status "failure" or "success"
     * @param {GoalCompletionListener} e
     * @returns {this}
     */
    addGoalCompletionListeners(...e: GoalCompletionListener[]);

    addClosedIssueListeners(...e: ClosedIssueListener[]): this;

    addTagListeners(...e: TagListener[]): this;

    addChannelLinkListeners(...e: ChannelLinkListener[]);

    addBuildListeners(...e: BuildListener[]);

    /**
     * You probably mean to use addNewRepoWithCodeActions!
     * This responds to a repo creation, but there may be no
     * code in it.
     * @param {RepoCreationListener} rcls
     * @return {this}
     */
    addRepoCreationListeners(...rcls: RepoCreationListener[]): this;

    addRepoOnboardingListeners(...rols: ProjectListener[]): this;

    addNewRepoWithCodeActions(...pls: PushListener[]): this;

    addPullRequestListeners(...pls: PullRequestListener[]): this;

    addGoalsSetListeners(...listeners: GoalsSetListener[]): this;

    addReviewerRegistrations(...reviewers: ReviewerRegistration[]): this;

    /**
     * Add review listeners. Will be invoked during a ReviewGoal
     * @param {ReviewListener} listeners
     * @return {this}
     */
    addReviewListeners(...listeners: ReviewListener[]): this;

    /**
     * Add reactions to a push: That is, functions that run during execution of a
     * PushReaction goal.
     * @param {PushReactionRegistration} prrs
     * @return {this}
     */
    addPushReactions(...prrs: PushReactionRegisterable[]): this;

    addArtifactListeners(...alrs: ArtifactListenerRegisterable[]): this;

    /**
     * Editors automatically invoked on eligible commits.
     * Note: be sure that these editors check and don't cause
     * infinite recursion!!
     */
    addAutofixes(...ars: AutofixRegistration[]): this;

    addFingerprinterRegistrations(...f: FingerprinterRegistration[]): this;

    addFingerprintListeners(...l: FingerprintListener[]): this;

    addFingerprintDifferenceListeners(...fh: FingerprintDifferenceListener[]): this;

    addDeploymentListeners(...l: DeploymentListener[]): this;

    addVerifiedDeploymentListeners(...l: VerifiedDeploymentListener[]): this;

    addEndpointVerificationListeners(...l: EndpointVerificationListener[]): this;

    addUserJoiningChannelListeners(...l: UserJoiningChannelListener[]): this;

}
