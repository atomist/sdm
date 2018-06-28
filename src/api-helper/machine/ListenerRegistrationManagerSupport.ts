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
import {
    GoalCompletionListener,
    GoalsSetListener,
} from "../../api/listener/GoalsSetListener";
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

    public addNewIssueListener(e: NewIssueListener): this {
        this.newIssueListeners.push(e);
        return this;
    }

    public addUpdatedIssueListener(e: UpdatedIssueListener): this {
        this.updatedIssueListeners.push(e);
        return this;
    }

    public addGoalCompletionListener(e: GoalCompletionListener): this {
        this.goalCompletionListeners.push(e);
        return this;
    }

    public addClosedIssueListener(e: ClosedIssueListener): this {
        this.closedIssueListeners.push(e);
        return this;
    }

    public addTagListener(e: TagListener): this {
        this.tagListeners.push(e);
        return this;
    }

    public addChannelLinkListener(e: ChannelLinkListener): this {
        this.channelLinkListeners.push(e);
        return this;
    }

    public addBuildListener(e: BuildListener): this {
        this.buildListeners.push(e);
        return this;
    }

    public addRepoCreationListener(rcls: RepoCreationListener): this {
        this.repoCreationListeners.push(rcls);
        return this;
    }

    public addRepoOnboardingListener(rols: ProjectListener): this {
        this.repoOnboardingListeners.push(rols);
        return this;
    }

    public addNewRepoWithCodeAction(pls: PushListener): this {
        this.newRepoWithCodeActions.push(pls);
        return this;
    }

    public addPullRequestListener(pls: PullRequestListener): this {
        this.pullRequestListeners.push(pls);
        return this;
    }

    public addGoalsSetListener(l: GoalsSetListener): this {
        this.goalsSetListeners.push(l);
        return this;
    }

    public addReviewerRegistration(r: ReviewerRegistration): this {
        this.reviewerRegistrations.push(r);
        return this;
    }

    public addReviewListener(l: ReviewListener): this {
        this.reviewListeners.push(l);
        return this;
    }

    public addPushReaction(r: PushReactionRegisterable): this {
        this.pushReactionRegistrations.push(r);
        return this;
    }

    public addArtifactListener(l: ArtifactListenerRegisterable): this {
        this.artifactListenerRegistrations.push(l);
        return this;
    }

    /**
     * Editors automatically invoked on eligible commits.
     * Note: be sure that these editors check and don't cause
     * infinite recursion!!
     */
    public addAutofix(fix: AutofixRegistration): this {
        this.autofixRegistrations.push(fix);
        return this;
    }

    public addFingerprinterRegistration(f: FingerprinterRegistration): this {
        this.fingerprinterRegistrations.push(f);
        return this;
    }

    public addFingerprintListener(l: FingerprintListener): this {
        this.fingerprintListeners.push(l);
        return this;
    }

    public addFingerprintDifferenceListener(fdl: FingerprintDifferenceListener): this {
        this.fingerprintDifferenceListeners.push(fdl);
        return this;
    }

    public addDeploymentListener(l: DeploymentListener): this {
        this.deploymentListeners.push(l);
        return this;
    }

    public addVerifiedDeploymentListener(l: VerifiedDeploymentListener): this {
        this.verifiedDeploymentListeners.push(l);
        return this;
    }

    public addEndpointVerificationListener(l: EndpointVerificationListener): this {
        this.endpointVerificationListeners.push(l);
        return this;
    }

    public addUserJoiningChannelListener(l: UserJoiningChannelListener): this {
        this.userJoiningChannelListeners.push(l);
        return this;
    }

}
