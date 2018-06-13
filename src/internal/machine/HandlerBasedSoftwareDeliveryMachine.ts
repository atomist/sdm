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

import { Configuration, HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { SdmGoalImplementationMapperImpl } from "../../api-helper/goal/SdmGoalImplementationMapperImpl";
import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { FunctionalUnit } from "../../api/machine/FunctionalUnit";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { ArtifactGoal, BuildGoal, JustBuildGoal } from "../../api/machine/wellKnownGoals";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { PushRules } from "../../api/mapping/support/PushRules";
import { deleteRepositoryCommand } from "../../handlers/commands/deleteRepository";
import { disposeCommand } from "../../handlers/commands/disposeCommand";
import { FindArtifactOnImageLinked } from "../../handlers/events/delivery/build/FindArtifactOnImageLinked";
import { InvokeListenersOnBuildComplete } from "../../handlers/events/delivery/build/InvokeListenersOnBuildComplete";
import { SetGoalOnBuildComplete } from "../../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { ReactToSemanticDiffsOnPushImpact } from "../../handlers/events/delivery/code/ReactToSemanticDiffsOnPushImpact";
import { OnDeployStatus } from "../../handlers/events/delivery/deploy/OnDeployStatus";
import { FulfillGoalOnRequested } from "../../handlers/events/delivery/goals/FulfillGoalOnRequested";
import { KubernetesIsolatedGoalLauncher } from "../../handlers/events/delivery/goals/k8s/launchGoalK8";
import { RequestDownstreamGoalsOnGoalSuccess } from "../../handlers/events/delivery/goals/RequestDownstreamGoalsOnGoalSuccess";
import { resetGoalsCommand } from "../../handlers/events/delivery/goals/resetGoals";
import { RespondOnGoalCompletion } from "../../handlers/events/delivery/goals/RespondOnGoalCompletion";
import { SetGoalsOnPush } from "../../handlers/events/delivery/goals/SetGoalsOnPush";
import { SkipDownstreamGoalsOnGoalFailure } from "../../handlers/events/delivery/goals/SkipDownstreamGoalsOnGoalFailure";
import { OnVerifiedDeploymentStatus } from "../../handlers/events/delivery/verify/OnVerifiedDeploymentStatus";
import { ClosedIssueHandler } from "../../handlers/events/issue/ClosedIssueHandler";
import { NewIssueHandler } from "../../handlers/events/issue/NewIssueHandler";
import { UpdatedIssueHandler } from "../../handlers/events/issue/UpdatedIssueHandler";
import { OnChannelLink } from "../../handlers/events/repo/OnChannelLink";
import { OnFirstPushToRepo } from "../../handlers/events/repo/OnFirstPushToRepo";
import { OnPullRequest } from "../../handlers/events/repo/OnPullRequest";
import { OnRepoCreation } from "../../handlers/events/repo/OnRepoCreation";
import { OnRepoOnboarded } from "../../handlers/events/repo/OnRepoOnboarded";
import { OnTag } from "../../handlers/events/repo/OnTag";
import { OnUserJoiningChannel } from "../../handlers/events/repo/OnUserJoiningChannel";
import { WellKnownGoals } from "../../pack/well-known-goals/addWellKnownGoals";
import { SendFingerprintToAtomist } from "../../util/webhook/sendFingerprintToAtomist";

/**
 * Implementation of SoftwareDeliveryMachine based on Atomist event handlers.
 * Not intended for direct user instantiation. See machineFactory.ts
 */
export class HandlerBasedSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    /*
     * Store all the implementations we know
     */
    public readonly goalFulfillmentMapper = new SdmGoalImplementationMapperImpl(
        // For now we only support kube or in process
        process.env.ATOMIST_GOAL_LAUNCHER === "kubernetes" ? KubernetesIsolatedGoalLauncher : undefined); // public for testing

    private get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(
                this.repoCreationListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver) :
            undefined;
    }

    private get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return this.newRepoWithCodeActions.length > 0 ?
            () => new OnFirstPushToRepo(
                this.newRepoWithCodeActions,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver) :
            undefined;
    }

    private get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceListeners.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(
                this.fingerprintDifferenceListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver) :
            undefined;
    }

    private get goalSetting(): FunctionalUnit {
        return {
            eventHandlers: [() => new SetGoalsOnPush(
                this.configuration.sdm.projectLoader,
                this.configuration.sdm.repoRefResolver,
                this.pushMapping,
                this.goalsSetListeners,
                this.goalFulfillmentMapper, this.configuration.sdm.credentialsResolver)],
            commandHandlers: [() => resetGoalsCommand({
                projectLoader: this.configuration.sdm.projectLoader,
                repoRefResolver: this.configuration.sdm.repoRefResolver,
                goalsListeners: this.goalsSetListeners,
                goalSetter: this.pushMapping,
                implementationMapping: this.goalFulfillmentMapper,
            })],
        };
    }

    private get goalConsequences(): FunctionalUnit {
        return {
            eventHandlers: [
                () => new SkipDownstreamGoalsOnGoalFailure(this.configuration.sdm.repoRefResolver),
                () => new RequestDownstreamGoalsOnGoalSuccess(
                    this.goalFulfillmentMapper,
                    this.configuration.sdm.repoRefResolver),
                () => new RespondOnGoalCompletion(
                    this.configuration.sdm.repoRefResolver,
                    this.configuration.sdm.credentialsResolver,
                    this.goalCompletionListeners)],
            commandHandlers: [],
        };
    }

    private readonly artifactFinder = () => new FindArtifactOnImageLinked(
        ArtifactGoal,
        this.artifactListenerRegistrations,
        this.configuration.sdm)

    private get notifyOnDeploy(): Maker<OnDeployStatus> {
        return this.deploymentListeners.length > 0 ?
            () => new OnDeployStatus(
                this.deploymentListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver) :
            undefined;
    }

    private get onVerifiedStatus(): Maker<OnVerifiedDeploymentStatus> {
        return this.verifiedDeploymentListeners.length > 0 ?
            () => new OnVerifiedDeploymentStatus(
                this.verifiedDeploymentListeners,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver) :
            undefined;
    }

    private get disposal(): FunctionalUnit {
        return {
            commandHandlers: [
                () => disposeCommand({
                    goalSetter: new PushRules("disposal", this.disposalGoalSetters),
                    repoRefResolver: this.configuration.sdm.repoRefResolver,
                    projectLoader: this.configuration.sdm.projectLoader,
                    goalsListeners: this.goalsSetListeners,
                    implementationMapping: this.goalFulfillmentMapper,
                }),
                deleteRepositoryCommand],
            eventHandlers: [],
        };
    }

    private readonly onBuildComplete: Maker<SetGoalOnBuildComplete> =
        () => new SetGoalOnBuildComplete([BuildGoal, JustBuildGoal], this.configuration.sdm.repoRefResolver)

    private get allFunctionalUnits(): FunctionalUnit[] {
        return []
            .concat([
                this.goalSetting,
                this.goalConsequences,
                this.disposal,
            ]);
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return this.registrationManager.eventHandlers
            .concat(() => new FulfillGoalOnRequested(
                this.goalFulfillmentMapper,
                this.configuration.sdm.projectLoader,
                this.configuration.sdm.repoRefResolver,
                this.configuration.sdm.credentialsResolver,
                this.configuration.sdm.logFactory))
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.eventHandlers)))
            .concat([
                this.userJoiningChannelListeners.length > 0 ?
                    () => new OnUserJoiningChannel(
                        this.userJoiningChannelListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.buildListeners.length > 0 ?
                    () => new InvokeListenersOnBuildComplete(
                        this.buildListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.tagListeners.length > 0 ?
                    () => new OnTag(
                        this.tagListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.newIssueListeners.length > 0 ?
                    () => new NewIssueHandler(
                        this.newIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.updatedIssueListeners.length > 0 ?
                    () => new UpdatedIssueHandler(
                        this.updatedIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.closedIssueListeners.length > 0 ?
                    () => new ClosedIssueHandler(
                        this.closedIssueListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.channelLinkListeners.length > 0 ?
                    () => new OnChannelLink(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.channelLinkListeners,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.pullRequestListeners.length > 0 ?
                    () => new OnPullRequest(
                        this.configuration.sdm.projectLoader,
                        this.configuration.sdm.repoRefResolver,
                        this.pullRequestListeners,
                        this.configuration.sdm.credentialsResolver) : undefined,
                this.repoOnboardingListeners.length > 0 ?
                    () => new OnRepoOnboarded(
                        this.repoOnboardingListeners,
                        this.configuration.sdm.repoRefResolver,
                        this.configuration.sdm.credentialsResolver) :
                    undefined,
                this.onRepoCreation,
                this.onNewRepoWithCode,
                this.semanticDiffReactor,
                this.onBuildComplete,
                this.notifyOnDeploy,
                this.onVerifiedStatus,
                this.artifactFinder,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.registrationManager.commandHandlers
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.commandHandlers)))
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
        // This hits the Atomist service
        this.addFingerprintListeners(SendFingerprintToAtomist);
        this.addExtensionPacks(WellKnownGoals);
    }

}
