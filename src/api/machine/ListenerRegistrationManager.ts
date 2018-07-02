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
import {
    GoalCompletionListener,
    GoalsSetListener,
} from "../listener/GoalsSetListener";
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
import {
    AutofixRegisterable,
    AutofixRegistration,
} from "../registration/AutofixRegistration";
import { FingerprinterRegistration } from "../registration/FingerprinterRegistration";
import { PushReactionRegisterable } from "../registration/PushReactionRegistration";
import { ReviewerRegistration } from "../registration/ReviewerRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 */
export interface ListenerRegistrationManager {

    addNewIssueListener(l: NewIssueListener): this;

    addUpdatedIssueListener(l: UpdatedIssueListener);

    /**
     * These are invoked when a goal reaches status "failure" or "success"
     * @param {GoalCompletionListener} l
     * @returns {this}
     */
    addGoalCompletionListener(l: GoalCompletionListener);

    addClosedIssueListener(l: ClosedIssueListener): this;

    addTagListener(l: TagListener): this;

    addChannelLinkListener(l: ChannelLinkListener);

    addBuildListener(l: BuildListener);

    /**
     * You probably mean to use addNewRepoWithCodeAction!
     * This responds to a repo creation, but there may be no
     * code in it.
     * @param {RepoCreationListener} rcls
     * @return {this}
     */
    addRepoCreationListener(rcl: RepoCreationListener): this;

    addRepoOnboardingListener(l: ProjectListener): this;

    addNewRepoWithCodeAction(pl: PushListener): this;

    addPullRequestListener(prl: PullRequestListener): this;

    addGoalsSetListener(l: GoalsSetListener): this;

    addReviewerRegistration(r: ReviewerRegistration): this;

    /**
     * Add review listener. Will be invoked during execution of a ReviewGoal
     * @param {ReviewListener} l
     * @return {this}
     */
    addReviewListener(l: ReviewListener): this;

    /**
     * Add a reaction to a push: That is, a function that runs during execution of a
     * PushReaction goal.
     * @param {PushReactionRegistration} prr
     * @return {this}
     */
    addPushReaction(prr: PushReactionRegisterable): this;

    addArtifactListener(l: ArtifactListenerRegisterable): this;

    /**
     * Add a transform automatically invoked on eligible commits.
     * Note: be sure that the transform checks and cannot cause
     * infinite recursion!!
     */
    addAutofix(fix: AutofixRegisterable): this;

    autofixRegistrations: AutofixRegistration[];

    addFingerprinterRegistration(f: FingerprinterRegistration): this;

    fingerprinterRegistrations: FingerprinterRegistration[];

    addFingerprintListener(l: FingerprintListener): this;

    fingerprintListeners: FingerprintListener[];

    addFingerprintDifferenceListener(fh: FingerprintDifferenceListener): this;

    addDeploymentListener(l: DeploymentListener): this;

    addVerifiedDeploymentListener(l: VerifiedDeploymentListener): this;

    addEndpointVerificationListener(l: EndpointVerificationListener): this;

    addUserJoiningChannelListener(l: UserJoiningChannelListener): this;

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
