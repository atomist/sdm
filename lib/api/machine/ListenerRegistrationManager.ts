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

import { BuildListener } from "../listener/BuildListener";
import { ChannelLinkListener } from "../listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../listener/ClosedIssueListener";
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
import { StartupListener } from "../listener/StartupListener";
import { TagListener } from "../listener/TagListener";
import { UpdatedIssueListener } from "../listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../listener/UserJoiningChannelListener";
import { FingerprinterRegistration } from "../registration/FingerprinterRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 */
export interface ListenerRegistrationManager {

    /**
     * Add a listener that will be notified of machine startup
     * @param {StartupListener} l
     * @return {this}
     */
    addStartupListener(l: StartupListener): this;

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
     * You probably mean to use addFirstPushListener!
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
    addFirstPushListener(pl: PushListener): this;

    addPullRequestListener(prl: PullRequestListener): this;

    addGoalsSetListener(l: GoalsSetListener): this;

    addGoalCompletionListener(l: GoalCompletionListener): this;

    goalExecutionListeners: GoalExecutionListener[];

    /**
     * @param {FingerprintDifferenceListener} fh
     * @return {this}
     */
    addFingerprintDifferenceListener(fh: FingerprintDifferenceListener): this;

    addUserJoiningChannelListener(l: UserJoiningChannelListener): this;

    startupListeners: StartupListener[];

    userJoiningChannelListeners: UserJoiningChannelListener[];

    tagListeners: TagListener[];

    newIssueListeners: NewIssueListener[];

    updatedIssueListeners: UpdatedIssueListener[];

    closedIssueListeners: ClosedIssueListener[];

    repoCreationListeners: RepoCreationListener[];

    repoOnboardingListeners: ProjectListener[];

    pullRequestListeners: PullRequestListener[];

    firstPushListeners: PushListener[];

    channelLinkListeners: ChannelLinkListener[];

    goalsSetListeners: GoalsSetListener[];

    goalCompletionListeners: GoalCompletionListener[];

}
