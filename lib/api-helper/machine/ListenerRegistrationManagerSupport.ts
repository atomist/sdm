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

import { ChannelLinkListener } from "../../api/listener/ChannelLinkListenerInvocation";
import { ClosedIssueListener } from "../../api/listener/ClosedIssueListener";
import { FingerprintDifferenceListener } from "../../api/listener/FingerprintDifferenceListener";
import { GoalCompletionListener } from "../../api/listener/GoalCompletionListener";
import { GoalsSetListener } from "../../api/listener/GoalsSetListener";
import { GoalExecutionListener } from "../../api/listener/GoalStatusListener";
import { NewIssueListener } from "../../api/listener/NewIssueListener";
import { ProjectListener } from "../../api/listener/ProjectListener";
import { PullRequestListener } from "../../api/listener/PullRequestListener";
import { PushListener } from "../../api/listener/PushListener";
import { RepoCreationListener } from "../../api/listener/RepoCreationListener";
import { StartupListener } from "../../api/listener/StartupListener";
import { TagListener } from "../../api/listener/TagListener";
import { UpdatedIssueListener } from "../../api/listener/UpdatedIssueListener";
import { UserJoiningChannelListener } from "../../api/listener/UserJoiningChannelListener";
import { ListenerRegistrationManager } from "../../api/machine/ListenerRegistrationManager";
import { TriggeredListenerRegistration } from "../../api/registration/TriggeredListenerRegistration";

/**
 * Listener management offering a fluent builder pattern for registrations.
 * This class is purely a registration store, and has no other behavior.
 */
export class ListenerRegistrationManagerSupport implements ListenerRegistrationManager {

    public readonly startupListeners: StartupListener[] = [];

    public readonly triggeredListeners: TriggeredListenerRegistration[] = [];

    public readonly fingerprintDifferenceListeners: FingerprintDifferenceListener[] = [];

    public readonly userJoiningChannelListeners: UserJoiningChannelListener[] = [];

    public readonly tagListeners: TagListener[] = [];

    public readonly newIssueListeners: NewIssueListener[] = [];

    public readonly updatedIssueListeners: UpdatedIssueListener[] = [];

    public readonly closedIssueListeners: ClosedIssueListener[] = [];

    public readonly repoCreationListeners: RepoCreationListener[] = [];

    public readonly repoOnboardingListeners: ProjectListener[] = [];

    public readonly pullRequestListeners: PullRequestListener[] = [];

    public readonly firstPushListeners: PushListener[] = [];

    public readonly channelLinkListeners: ChannelLinkListener[] = [];

    public readonly goalsSetListeners: GoalsSetListener[] = [];

    public readonly goalCompletionListeners: GoalCompletionListener[] = [];

    public readonly goalExecutionListeners: GoalExecutionListener[] = [];

    public addStartupListener(l: StartupListener): this {
        this.startupListeners.push(l);
        return this;
    }

    public addTriggeredListener(t: TriggeredListenerRegistration): this {
        this.triggeredListeners.push(t);
        return this;
    }

    public addNewIssueListener(e: NewIssueListener): this {
        this.newIssueListeners.push(e);
        return this;
    }

    public addUpdatedIssueListener(e: UpdatedIssueListener): this {
        this.updatedIssueListeners.push(e);
        return this;
    }

    public addGoalExecutionListener(e: GoalExecutionListener): this {
        this.goalExecutionListeners.push(e);
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

    public addRepoCreationListener(rcls: RepoCreationListener): this {
        this.repoCreationListeners.push(rcls);
        return this;
    }

    public addRepoOnboardingListener(rols: ProjectListener): this {
        this.repoOnboardingListeners.push(rols);
        return this;
    }

    public addFirstPushListener(pls: PushListener): this {
        this.firstPushListeners.push(pls);
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

    public addGoalCompletionListener(l: GoalCompletionListener): this {
        this.goalCompletionListeners.push(l);
        return this;
    }

    public addFingerprintDifferenceListener(fdl: FingerprintDifferenceListener): this {
        this.fingerprintDifferenceListeners.push(fdl);
        return this;
    }

    public addUserJoiningChannelListener(l: UserJoiningChannelListener): this {
        this.userJoiningChannelListeners.push(l);
        return this;
    }

}
