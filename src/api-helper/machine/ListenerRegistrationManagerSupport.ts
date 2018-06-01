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

import { ArtifactListenerRegisterable } from "../../api/listener/ArtifactListener";
import { BuildListener } from "../../api/listener/BuildListener";
import { ChannelLinkListener } from "../../api/listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../../api/listener/ClosedIssueListener";
import { DeploymentListener } from "../../api/listener/DeploymentListener";
import { EndpointVerificationListener } from "../../api/listener/EndpointVerificationListener";
import { FingerprintDifferenceListener } from "../../api/listener/FingerprintDifferenceListener";
import { FingerprintListener } from "../../api/listener/FingerprintListener";
import { GoalCompletionListener, GoalsSetListener } from "../../api/listener/GoalsSetListener";
import { NewIssueListener } from "../../api/listener/NewIssueListener";
import { ProjectListener } from "../../api/listener/ProjectListener";
import { PullRequestListener } from "../../api/listener/PullRequestListener";
import { PushListener } from "../../api/listener/PushListener";
import { RepoCreationListener } from "../../api/listener/RepoCreationListener";
import { ReviewListener } from "../../api/listener/ReviewListener";
import { TagListener } from "../../api/listener/TagListener";
import { UpdatedIssueListener } from "../../api/listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../../api/listener/UserJoiningChannelListener";
import { VerifiedDeploymentListener } from "../../api/listener/VerifiedDeploymentListener";
import { ListenerRegistrationManager } from "../../api/machine/ListenerRegistrationManager";
import { AutofixRegistration } from "../../api/registration/AutofixRegistration";
import { FingerprinterRegistration } from "../../api/registration/FingerprinterRegistration";
import { PushReactionRegisterable } from "../../api/registration/PushReactionRegistration";
import { ReviewerRegistration } from "../../api/registration/ReviewerRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 * This class is purely a registration store, and has no other behavior.
 */
export class ListenerRegistrationManagerSupport implements ListenerRegistrationManager {

    public readonly autofixRegistrations: AutofixRegistration[] = [];

    public readonly fingerprintListeners: FingerprintListener[] = [];

    public readonly fingerprintDifferenceListeners: FingerprintDifferenceListener[] = [];

    public readonly fingerprinterRegistrations: FingerprinterRegistration[] = [];

    public readonly userJoiningChannelListeners: UserJoiningChannelListener[] = [];

    public readonly tagListeners: TagListener[] = [];

    public readonly newIssueListeners: NewIssueListener[] = [];

    public readonly updatedIssueListeners: UpdatedIssueListener[] = [];

    public readonly closedIssueListeners: ClosedIssueListener[] = [];

    public readonly repoCreationListeners: RepoCreationListener[] = [];

    public readonly repoOnboardingListeners: ProjectListener[] = [];

    public readonly pullRequestListeners: PullRequestListener[] = [];

    public readonly newRepoWithCodeActions: PushListener[] = [];

    public readonly channelLinkListeners: ChannelLinkListener[] = [];

    public readonly goalsSetListeners: GoalsSetListener[] = [];

    public readonly reviewerRegistrations: ReviewerRegistration[] = [];

    public readonly reviewListeners: ReviewListener[] = [];

    public readonly pushReactionRegistrations: PushReactionRegisterable[] = [];

    public readonly artifactListenerRegistrations: ArtifactListenerRegisterable[] = [];

    protected readonly buildListeners: BuildListener[] = [];

    protected readonly deploymentListeners?: DeploymentListener[] = [];

    protected readonly verifiedDeploymentListeners: VerifiedDeploymentListener[] = [];

    protected readonly endpointVerificationListeners: EndpointVerificationListener[] = [];

    protected readonly goalCompletionListeners: GoalCompletionListener[] = [];

    public addNewIssueListeners(...e: NewIssueListener[]): this {
        this.newIssueListeners.push(...e);
        return this;
    }

    public addUpdatedIssueListeners(...e: UpdatedIssueListener[]): this {
        this.updatedIssueListeners.push(...e);
        return this;
    }

    /**
     * These are invoked when a goal reaches status "failure" or "success"
     * @param {GoalCompletionListener} e
     * @returns {this}
     */
    public addGoalCompletionListeners(...e: GoalCompletionListener[]): this {
        this.goalCompletionListeners.push(...e);
        return this;
    }

    public addClosedIssueListeners(...e: ClosedIssueListener[]): this {
        this.closedIssueListeners.push(...e);
        return this;
    }

    public addTagListeners(...e: TagListener[]): this {
        this.tagListeners.push(...e);
        return this;
    }

    public addChannelLinkListeners(...e: ChannelLinkListener[]): this {
        this.channelLinkListeners.push(...e);
        return this;
    }

    public addBuildListeners(...e: BuildListener[]): this {
        this.buildListeners.push(...e);
        return this;
    }

    /**
     * You probably mean to use addNewRepoWithCodeActions!
     * This responds to a repo creation, but there may be no
     * code in it.
     * @param {RepoCreationListener} rcls
     * @return {this}
     */
    public addRepoCreationListeners(...rcls: RepoCreationListener[]): this {
        this.repoCreationListeners.push(...rcls);
        return this;
    }

    public addRepoOnboardingListeners(...rols: ProjectListener[]): this {
        this.repoOnboardingListeners.push(...rols);
        return this;
    }

    public addNewRepoWithCodeActions(...pls: PushListener[]): this {
        this.newRepoWithCodeActions.push(...pls);
        return this;
    }

    public addPullRequestListeners(...pls: PullRequestListener[]): this {
        this.pullRequestListeners.push(...pls);
        return this;
    }

    public addGoalsSetListeners(...listeners: GoalsSetListener[]): this {
        this.goalsSetListeners.push(...listeners);
        return this;
    }

    public addReviewerRegistrations(...reviewers: ReviewerRegistration[]): this {
        this.reviewerRegistrations.push(...reviewers);
        return this;
    }

    /**
     * Add review listeners. Will be invoked during a ReviewGoal
     * @param {ReviewListener} listeners
     * @return {this}
     */
    public addReviewListeners(...listeners: ReviewListener[]): this {
        this.reviewListeners.push(...listeners);
        return this;
    }

    /**
     * Add reactions to a push: That is, functions that run during execution of a
     * PushReaction goal.
     * @param {PushReactionRegistration} prrs
     * @return {this}
     */
    public addPushReactions(...prrs: PushReactionRegisterable[]): this {
        this.pushReactionRegistrations.push(...prrs);
        return this;
    }

    public addArtifactListeners(...alrs: ArtifactListenerRegisterable[]): this {
        this.artifactListenerRegistrations.push(...alrs);
        return this;
    }

    /**
     * Editors automatically invoked on eligible commits.
     * Note: be sure that these editors check and don't cause
     * infinite recursion!!
     */
    public addAutofixes(...ars: AutofixRegistration[]): this {
        this.autofixRegistrations.push(...ars);
        return this;
    }

    public addFingerprinterRegistrations(...f: FingerprinterRegistration[]): this {
        this.fingerprinterRegistrations.push(...f);
        return this;
    }

    public addFingerprintListeners(...l: FingerprintListener[]): this {
        this.fingerprintListeners.push(...l);
        return this;
    }

    public addFingerprintDifferenceListeners(...fh: FingerprintDifferenceListener[]): this {
        this.fingerprintDifferenceListeners.push(...fh);
        return this;
    }

    public addDeploymentListeners(...l: DeploymentListener[]): this {
        this.deploymentListeners.push(...l);
        return this;
    }

    public addVerifiedDeploymentListeners(...l: VerifiedDeploymentListener[]): this {
        this.verifiedDeploymentListeners.push(...l);
        return this;
    }

    public addEndpointVerificationListeners(...l: EndpointVerificationListener[]): this {
        this.endpointVerificationListeners.push(...l);
        return this;
    }

    public addUserJoiningChannelListeners(...l: UserJoiningChannelListener[]): this {
        this.userJoiningChannelListeners.push(...l);
        return this;
    }

}
