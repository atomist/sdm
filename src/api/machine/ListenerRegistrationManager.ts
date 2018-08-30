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

import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { ArtifactListenerRegisterable } from "../listener/ArtifactListener";
import { BuildListener } from "../listener/BuildListener";
import { ChannelLinkListener } from "../listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../listener/ClosedIssueListener";
import { DeploymentListener } from "../listener/DeploymentListener";
import { EndpointVerificationListener } from "../listener/EndpointVerificationListener";
import { FingerprintDifferenceListener } from "../listener/FingerprintDifferenceListener";
import { FingerprintListener } from "../listener/FingerprintListener";
import { GoalCompletionListener } from "../listener/GoalCompletionListener";
import { GoalsSetListener } from "../listener/GoalsSetListener";
import { GoalExecutionListener } from "../listener/GoalStatusListener";
import { NewIssueListener } from "../listener/NewIssueListener";
import { ProjectListener } from "../listener/ProjectListener";
import { PullRequestListener } from "../listener/PullRequestListener";
import { PushListener } from "../listener/PushListener";
import { RepoCreationListener } from "../listener/RepoCreationListener";
import { TagListener } from "../listener/TagListener";
import { UpdatedIssueListener } from "../listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../listener/UserJoiningChannelListener";
import { VerifiedDeploymentListener } from "../listener/VerifiedDeploymentListener";
import { AutofixRegistration } from "../registration/AutofixRegistration";
import { AutoInspectRegistration } from "../registration/AutoInspectRegistration";
import { FingerprinterRegistration } from "../registration/FingerprinterRegistration";
import { PushImpactListenerRegisterable } from "../registration/PushImpactListenerRegistration";
import { ReviewListenerRegistration } from "../registration/ReviewListenerRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 */
export interface ListenerRegistrationManager {

    /**
     * Add a listener that reacts to new issues
     * @param {NewIssueListener} l
     * @return {this}
     */
    addNewIssueListener(l: NewIssueListener): this;

    addUpdatedIssueListener(l: UpdatedIssueListener);

    /**
     * Invoked when a goal state changes
     * @returns {this}
     */
    addGoalExecutionListener(l: GoalExecutionListener);

    addClosedIssueListener(l: ClosedIssueListener): this;

    addTagListener(l: TagListener): this;

    addChannelLinkListener(l: ChannelLinkListener);

    /**
     * Add a listener that react to builds. Listeners will get multiple
     * calls for each build as builds start and complete.
     * @param {BuildListener} l
     */
    addBuildListener(l: BuildListener);

    /**
     * You probably mean to use addNewRepoWithCodeListener!
     * This responds to a repo creation, but there may be no
     * code in it. The invocation's addressChannels method with have no effect:
     * use the context if you want to send messages
     * @param {RepoCreationListener} rcl
     * @return {this}
     */
    addRepoCreationListener(rcl: RepoCreationListener): this;

    /**
     * Register a listener that reacts to a repo being
     * brought to Atomist's notice
     * @param {ProjectListener} l
     * @return {this}
     */
    addRepoOnboardingListener(l: ProjectListener): this;

    /**
     * Register a listener that reacts to a new repo appearing with
     * content. The invocation's addressChannels will DM the
     * creator of the project if possible, as any channel mapping
     * will not have been set up.
     * @param {PushListener} pl
     * @return {this}
     */
    addNewRepoWithCodeListener(pl: PushListener): this;

    addPullRequestListener(prl: PullRequestListener): this;

    addGoalsSetListener(l: GoalsSetListener): this;

    addGoalCompletionListener(l: GoalCompletionListener): this;

    /**
     * Register an auto inspection.
     * @param {AutoInspectRegistration<R, PARAMS>} r
     * @return {this}
     */
    addAutoInspectRegistration<R, PARAMS= NoParameters>(r: AutoInspectRegistration<R, PARAMS>): this;

    /**
     * Add a registration to listen to reviews. Will be invoked during execution of a CodeInspectionGoal
     * @param r registration
     * @return {this}
     */
    addReviewListenerRegistration(r: ReviewListenerRegistration): this;

    /**
     * Add listener to pushes: That is, a function that runs during execution of a
     * PushReaction goal.
     * @param {PushImpactListenerRegistration} prr
     * @return {this}
     */
    addPushImpactListener(prr: PushImpactListenerRegisterable): this;

    addArtifactListener(l: ArtifactListenerRegisterable): this;

    /**
     * Add a transform automatically invoked on eligible commits.
     * Note: be sure that the transform checks and cannot cause
     * infinite recursion!!
     */
    addAutofix<P>(fix: AutofixRegistration<P>): this;

    autofixRegistrations: AutofixRegistration[];

    addFingerprinterRegistration(f: FingerprinterRegistration): this;

    fingerprinterRegistrations: FingerprinterRegistration[];

    addFingerprintListener(l: FingerprintListener): this;

    fingerprintListeners: FingerprintListener[];

    goalExecutionListeners: GoalExecutionListener[];

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

    newRepoWithCodeListeners: PushListener[];

    channelLinkListeners: ChannelLinkListener[];

    goalsSetListeners: GoalsSetListener[];

    goalCompletionListeners: GoalCompletionListener[];

    autoInspectRegistrations: Array<AutoInspectRegistration<any, any>>;

    reviewListenerRegistrations: ReviewListenerRegistration[];

    pushImpactListenerRegistrations: PushImpactListenerRegisterable[];

    artifactListenerRegistrations: ArtifactListenerRegisterable[];

}
