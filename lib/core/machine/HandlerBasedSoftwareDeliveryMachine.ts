/*
 * Copyright © 2020 Atomist, Inc.
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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
import * as _ from "lodash";
import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { FunctionalUnit } from "../../api/machine/FunctionalUnit";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { SkillOutputGoalExecutionListener } from "../goal/skillOutput";
import { FulfillGoalOnRequested } from "../handlers/events/delivery/goals/FulfillGoalOnRequested";
import { RequestDownstreamGoalsOnGoalSuccess } from "../handlers/events/delivery/goals/RequestDownstreamGoalsOnGoalSuccess";
import { RespondOnGoalCompletion } from "../handlers/events/delivery/goals/RespondOnGoalCompletion";
import { SetGoalsOnGoal } from "../handlers/events/delivery/goals/SetGoalsOnGoal";
import { SetGoalsOnPush } from "../handlers/events/delivery/goals/SetGoalsOnPush";
import { SetGoalsOnSkillOutput } from "../handlers/events/delivery/goals/SetGoalsOnSkillOutput";
import { SkipDownstreamGoalsOnGoalFailure } from "../handlers/events/delivery/goals/SkipDownstreamGoalsOnGoalFailure";
import { VoteOnGoalApprovalRequest } from "../handlers/events/delivery/goals/VoteOnGoalApprovalRequest";
import { ClosedIssueHandler } from "../handlers/events/issue/ClosedIssueHandler";
import { NewIssueHandler } from "../handlers/events/issue/NewIssueHandler";
import { UpdatedIssueHandler } from "../handlers/events/issue/UpdatedIssueHandler";
import { OnChannelLink } from "../handlers/events/repo/OnChannelLink";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { OnPullRequest } from "../handlers/events/repo/OnPullRequest";
import { OnRepoCreation } from "../handlers/events/repo/OnRepoCreation";
import { OnRepoOnboarded } from "../handlers/events/repo/OnRepoOnboarded";
import { OnTag } from "../handlers/events/repo/OnTag";
import { OnUserJoiningChannel } from "../handlers/events/repo/OnUserJoiningChannel";

/**
 * Implementation of SoftwareDeliveryMachine based on Atomist event handlers.
 * Not intended for direct user instantiation. See machineFactory.ts
 */
export class HandlerBasedSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    private get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(
                this.repoCreationListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver,
                this.configuration.sdm.preferenceStoreFactory) :
            undefined;
    }

    private get onFirstPush(): Maker<OnFirstPushToRepo> {
        return this.firstPushListeners.length > 0 ?
            () => new OnFirstPushToRepo(
                this.firstPushListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver,
                this.configuration.sdm.preferenceStoreFactory) :
            undefined;
    }

    private get goalSetting(): FunctionalUnit {
        if (this.pushMapping) {
            return {
                eventHandlers: [
                    () => new SetGoalsOnPush(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.pushMapping,
                        this.goalsSetListeners,
                        this.goalFulfillmentMapper,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory,
                        this.configuration.sdm.enrichGoal,
                        this.configuration.sdm.tagGoalSet),
                    () => new SetGoalsOnGoal(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.pushMapping,
                        this.goalsSetListeners,
                        this.goalFulfillmentMapper,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory,
                        this.configuration.sdm.enrichGoal,
                        this.configuration.sdm.tagGoalSet),
                    () => new SetGoalsOnSkillOutput(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.pushMapping,
                        this.goalsSetListeners,
                        this.goalFulfillmentMapper,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory,
                        this.configuration.sdm.enrichGoal,
                        this.configuration.sdm.tagGoalSet)],
                commandHandlers: [],
                ingesters: [],
            };
        } else {
            return {
                eventHandlers: [],
                commandHandlers: [],
                ingesters: [],
            };
        }
    }

    private get goalConsequences(): FunctionalUnit {
        if (this.pushMapping) {
            return {
                eventHandlers: [
                    () => new SkipDownstreamGoalsOnGoalFailure(),
                    () => new RequestDownstreamGoalsOnGoalSuccess(
                        this.configuration.name,
                        this.goalFulfillmentMapper,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory),
                    () => new RespondOnGoalCompletion(
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.goalCompletionListeners,
                        this.configuration.sdm.preferenceStoreFactory),
                    () => new VoteOnGoalApprovalRequest(
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.goalApprovalRequestVoters,
                        this.goalApprovalRequestVoteDecisionManager,
                        this.goalFulfillmentMapper,
                        this.configuration.sdm.preferenceStoreFactory)],
                commandHandlers: [],
                ingesters: [],
            };
        } else {
            return {
                eventHandlers: [],
                commandHandlers: [],
                ingesters: [],
            };
        }
    }

    private get allFunctionalUnits(): FunctionalUnit[] {
        return []
            .concat([
                this.goalSetting,
                this.goalConsequences,
            ]);
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return this.registrationManager.eventHandlers
            .concat(this.goalFulfillmentMapper.hasImplementation() ? () => new FulfillGoalOnRequested(
                this.goalFulfillmentMapper,
                this.goalExecutionListeners) : undefined)
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.eventHandlers)))
            .concat([
                this.userJoiningChannelListeners.length > 0 ?
                    () => new OnUserJoiningChannel(
                        this.userJoiningChannelListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.tagListeners.length > 0 ?
                    () => new OnTag(
                        this.tagListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.newIssueListeners.length > 0 ?
                    () => new NewIssueHandler(
                        this.newIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.updatedIssueListeners.length > 0 ?
                    () => new UpdatedIssueHandler(
                        this.updatedIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.closedIssueListeners.length > 0 ?
                    () => new ClosedIssueHandler(
                        this.closedIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.channelLinkListeners.length > 0 ?
                    () => new OnChannelLink(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.channelLinkListeners,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.pullRequestListeners.length > 0 ?
                    () => new OnPullRequest(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.pullRequestListeners,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) : undefined,
                this.repoOnboardingListeners.length > 0 ?
                    () => new OnRepoOnboarded(
                        this.repoOnboardingListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver,
                        this.configuration.sdm.preferenceStoreFactory) :
                    undefined,
                this.onRepoCreation,
                this.onFirstPush,
            ])
            .filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.registrationManager.commandHandlers
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.commandHandlers)))
            .filter(m => !!m);
    }

    get ingesters(): string[] {
        return this.registrationManager.ingesters
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.ingesters)))
            .filter(m => !!m);
    }

    /**
     * Construct a new software delivery machine, with zero or
     * more goal setters.
     * @param {string} name
     * @param configuration automation client configuration we're running in
     * @param {GoalSetter} goalSetters tell me what to do on a push. Hint: start with "whenPushSatisfies(...)"
     */
    constructor(name: string,
                configuration: Configuration & SoftwareDeliveryMachineConfiguration,
                goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super(name, configuration, goalSetters);
        this.addGoalExecutionListener(SkillOutputGoalExecutionListener);
    }

}
