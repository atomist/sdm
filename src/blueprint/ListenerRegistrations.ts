/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AutofixRegistration } from "../common/delivery/code/autofix/AutofixRegistration";
import { CodeActionRegistration } from "../common/delivery/code/CodeActionRegistration";
import { FingerprinterRegistration } from "../common/delivery/code/fingerprint/FingerprinterRegistration";
import { ReviewerRegistration } from "../common/delivery/code/review/ReviewerRegistration";
import { ArtifactListener } from "../common/listener/ArtifactListener";
import { ChannelLinkListener } from "../common/listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../common/listener/ClosedIssueListener";
import { DeploymentListener } from "../common/listener/DeploymentListener";
import { FingerprintDifferenceListener } from "../common/listener/FingerprintDifferenceListener";
import { GoalsSetListener } from "../common/listener/GoalsSetListener";
import { NewIssueListener } from "../common/listener/NewIssueListener";
import { PullRequestListener } from "../common/listener/PullRequestListener";
import { PushListener } from "../common/listener/PushListener";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";
import { SupersededListener } from "../common/listener/SupersededListener";
import { UpdatedIssueListener } from "../common/listener/UpdatedIssueListener";
import { VerifiedDeploymentListener } from "../common/listener/VerifiedDeploymentListener";
import { EndpointVerificationListener } from "../handlers/events/delivery/verify/executeVerifyEndpoint";

/**
 * Simple listener management offering a fluent builder pattern registrations
 */
export class ListenerRegistrations {

    protected readonly newIssueListeners: NewIssueListener[] = [];

    protected readonly updatedIssueListeners: UpdatedIssueListener[] = [];

    protected readonly closedIssueListeners: ClosedIssueListener[] = [];

    protected readonly repoCreationListeners: RepoCreationListener[] = [];

    protected readonly pullRequestListeners: PullRequestListener[] = [];

    protected readonly newRepoWithCodeActions: PushListener[] = [];

    protected readonly channelLinkListeners: ChannelLinkListener[] = [];

    protected readonly goalsSetListeners: GoalsSetListener[] = [];

    protected readonly reviewerRegistrations: ReviewerRegistration[] = [];

    protected readonly codeReactionRegistrations: CodeActionRegistration[] = [];

    protected readonly autofixRegistrations: AutofixRegistration[] = [];

    protected readonly artifactListeners: ArtifactListener[] = [];

    protected readonly fingerprinterRegistrations: FingerprinterRegistration[] = [];

    protected readonly supersededListeners: SupersededListener[] = [];

    protected readonly fingerprintDifferenceListeners: FingerprintDifferenceListener[] = [];

    protected readonly deploymentListeners?: DeploymentListener[] = [];

    protected readonly verifiedDeploymentListeners: VerifiedDeploymentListener[] = [];

    protected readonly endpointVerificationListeners: EndpointVerificationListener[] = [];

    public addNewIssueListeners(...e: NewIssueListener[]): this {
        this.newIssueListeners.push(...e);
        return this;
    }

    public addUpdatedIssueListeners(...e: UpdatedIssueListener[]): this {
        this.updatedIssueListeners.push(...e);
        return this;
    }

    public addClosedIssueListeners(...e: ClosedIssueListener[]): this {
        this.closedIssueListeners.push(...e);
        return this;
    }

    public addChannelLinkListeners(...e: ChannelLinkListener[]): this {
        this.channelLinkListeners.push(...e);
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

    public addCodeReactions(...crrs: CodeActionRegistration[]): this {
        this.codeReactionRegistrations.push(...crrs);
        return this;
    }

    public addArtifactListeners(...pls: ArtifactListener[]): this {
        this.artifactListeners.push(...pls);
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

    public addSupersededListeners(...l: SupersededListener[]): this {
        this.supersededListeners.push(...l);
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

}
