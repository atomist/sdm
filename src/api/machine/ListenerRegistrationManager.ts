/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ArtifactListenerRegisterable } from "../listener/ArtifactListener";
import { BuildListener } from "../listener/BuildListener";
import { ChannelLinkListener } from "../listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../listener/ClosedIssueListener";
import { DeploymentListener } from "../listener/DeploymentListener";
import { EndpointVerificationListener } from "../listener/EndpointVerificationListener";
import { FingerprintDifferenceListener } from "../listener/FingerprintDifferenceListener";
import { FingerprintListener } from "../listener/FingerprintListener";
import { GoalCompletionListener, GoalsSetListener } from "../listener/GoalsSetListener";
import { NewIssueListener } from "../listener/NewIssueListener";
import { ProjectListener } from "../listener/ProjectListener";
import { PullRequestListener } from "../listener/PullRequestListener";
import { PushListener } from "../listener/PushListener";
import { RepoCreationListener } from "../listener/RepoCreationListener";
import { ReviewListener } from "../listener/ReviewListener";
import { TagListener } from "../listener/TagListener";
import { UpdatedIssueListener } from "../listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../listener/UserJoiningChannelListener";
import { VerifiedDeploymentListener } from "../listener/VerifiedDeploymentListener";
import { AutofixRegistration } from "../registration/AutofixRegistration";
import { FingerprinterRegistration } from "../registration/FingerprinterRegistration";
import { PushReactionRegisterable } from "../registration/PushReactionRegistration";
import { ReviewerRegistration } from "../registration/ReviewerRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 */
export interface ListenerRegistrationManager {

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

    autofixRegistrations: AutofixRegistration[];

    addFingerprinterRegistrations(...f: FingerprinterRegistration[]): this;

    fingerprinterRegistrations: FingerprinterRegistration[];

    addFingerprintListeners(...l: FingerprintListener[]): this;

    fingerprintListeners: FingerprintListener[];

    addFingerprintDifferenceListeners(...fh: FingerprintDifferenceListener[]): this;

    addDeploymentListeners(...l: DeploymentListener[]): this;

    addVerifiedDeploymentListeners(...l: VerifiedDeploymentListener[]): this;

    addEndpointVerificationListeners(...l: EndpointVerificationListener[]): this;

    addUserJoiningChannelListeners(...l: UserJoiningChannelListener[]): this;

    userJoiningChannelListeners: UserJoiningChannelListener[];

    tagListeners: TagListener[];

    newIssueListeners: NewIssueListener[];

    updatedIssueListeners: UpdatedIssueListener[];

    closedIssueListeners: ClosedIssueListener[];

    repoCreationListeners: RepoCreationListener[];

    repoOnboardingListeners: ProjectListener[];

    pullRequestListeners: PullRequestListener[];

    newRepoWithCodeActions: PushListener[];

    channelLinkListeners: ChannelLinkListener[];

    goalsSetListeners: GoalsSetListener[];

    reviewerRegistrations: ReviewerRegistration[];

    reviewListeners: ReviewListener[];

    pushReactionRegistrations: PushReactionRegisterable[];

    artifactListenerRegistrations: ArtifactListenerRegisterable[];

}
