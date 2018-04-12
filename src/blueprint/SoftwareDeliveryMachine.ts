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

// tslint:disable:max-file-line-count

import { HandleCommand, HandleEvent, logger } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import {
    ArtifactGoal,
    AutofixGoal,
    BuildGoal,
    CodeReactionGoal,
    DeleteAfterUndeploysGoal,
    DeleteRepositoryGoal,
    FingerprintGoal,
    JustBuildGoal,
    NoGoal,
    ReviewGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
} from "../common/delivery/goals/common/commonGoals";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/FindArtifactOnImageLinked";
import { SetGoalOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/delivery/code/ReactToSemanticDiffsOnPushImpact";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamGoalsOnGoalFailure } from "../handlers/events/delivery/goals/FailDownstreamGoalsOnGoalFailure";
import { executeVerifyEndpoint, SdmVerification } from "../handlers/events/delivery/verify/executeVerifyEndpoint";
import { OnVerifiedDeploymentStatus } from "../handlers/events/delivery/verify/OnVerifiedDeploymentStatus";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { OnRepoCreation } from "../handlers/events/repo/OnRepoCreation";
import { FunctionalUnit } from "./FunctionalUnit";
import { ReferenceDeliveryBlueprint } from "./ReferenceDeliveryBlueprint";

import * as _ from "lodash";
import { executeBuild } from "../common/delivery/build/executeBuild";
import { executeAutofixes } from "../common/delivery/code/autofix/executeAutofixes";
import { executeCodeReactions } from "../common/delivery/code/executeCodeReactions";
import { executeFingerprinting } from "../common/delivery/code/fingerprint/executeFingerprinting";
import { executeReview } from "../common/delivery/code/review/executeReview";
import { Target } from "../common/delivery/deploy/deploy";
import { executeDeploy } from "../common/delivery/deploy/executeDeploy";
import { CopyGoalToGitHubStatus } from "../common/delivery/goals/CopyGoalToGitHubStatus";
import { Goal } from "../common/delivery/goals/Goal";
import { SdmGoalImplementationMapper } from "../common/delivery/goals/SdmGoalImplementationMapper";
import { GoalSetter } from "../common/listener/GoalSetter";
import { PushTest } from "../common/listener/PushTest";
import { AnyPush } from "../common/listener/support/pushtest/commonPushTests";
import { StaticPushMapping } from "../common/listener/support/StaticPushMapping";
import { ProjectLoader } from "../common/repo/ProjectLoader";
import { selfDescribeHandler } from "../handlers/commands/SelfDescribe";
import { displayBuildLogHandler } from "../handlers/commands/ShowBuildLog";

import { createRepoHandler } from "../common/command/generator/createRepo";
import { listGeneratorsHandler } from "../common/command/generator/listGenerators";
import { lastLinesLogInterpreter, LogSuppressor } from "../common/delivery/goals/support/logInterpreters";
import { ExecuteGoalWithLog } from "../common/delivery/goals/support/reportGoalError";
import { PushRule } from "../common/listener/support/PushRule";
import { CopyStatusApprovalToGoal } from "../handlers/events/delivery/goals/CopyStatusApprovalToGoal";
import { FulfillGoalOnRequested } from "../handlers/events/delivery/goals/FulfillGoalOnRequested";

import { executeUndeploy, offerToDeleteRepository } from "../common/delivery/deploy/executeUndeploy";
import { deleteRepositoryCommand } from "../handlers/commands/deleteRepository";
import { disposeCommand } from "../handlers/commands/disposeCommand";
import { triggerGoal } from "../handlers/commands/triggerGoal";
import { RequestDownstreamGoalsOnGoalSuccess } from "../handlers/events/delivery/goals/RequestDownstreamGoalsOnGoalSuccess";
import { resetGoalsCommand } from "../handlers/events/delivery/goals/resetGoals";
import { executeImmaterial, SetGoalsOnPush } from "../handlers/events/delivery/goals/SetGoalsOnPush";
import { OnSupersededStatus } from "../handlers/events/delivery/superseded/OnSuperseded";
import { SetSupersededStatus } from "../handlers/events/delivery/superseded/SetSupersededStatus";
import { ClosedIssueHandler } from "../handlers/events/issue/ClosedIssueHandler";
import { NewIssueHandler } from "../handlers/events/issue/NewIssueHandler";
import { UpdatedIssueHandler } from "../handlers/events/issue/UpdatedIssueHandler";
import { OnChannelLink } from "../handlers/events/repo/OnChannelLink";
import { OnPullRequest } from "../handlers/events/repo/OnPullRequest";
import { ArtifactStore } from "../spi/artifact/ArtifactStore";
import { Builder } from "../spi/build/Builder";
import { LogInterpreter } from "../spi/log/InterpretedLog";
import { ListenerRegistrations } from "./ListenerRegistrations";

/**
 * Infrastructure options for a SoftwareDeliveryMachine
 */
export interface SoftwareDeliveryMachineOptions {

    artifactStore: ArtifactStore;
    projectLoader: ProjectLoader;
}

// NEXT: store the implementation with the goal

/**
 * Core entry point for constructing a Software Delivery Machine.
 * Represents a possible delivery process spanning
 * goals of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment.
 * Driven by Goals
 * Uses the builder pattern.
 */
export class SoftwareDeliveryMachine extends ListenerRegistrations implements ReferenceDeliveryBlueprint {

    public generators: Array<Maker<HandleCommand>> = [];

    public editors: Array<Maker<HandleCommand>> = [];

    public supportingCommands: Array<Maker<HandleCommand>> = [];

    public supportingEvents: Array<Maker<HandleEvent<any>>> = [];

    public functionalUnits: FunctionalUnit[] = [];

    public readonly goalSetters: GoalSetter[] = [];

    private readonly disposalGoalSetters: GoalSetter[] = [];

    /*
     * Store all the implementations we know
     */
    public readonly goalFulfillmentMapper = new SdmGoalImplementationMapper(); // public for testing

    private readonly goalRetryCommandMap: { [key: string]: Maker<HandleCommand<any>> } = {};

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoalWithLog} goalExecutor
     * @param options PushTest to narrow matching & LogInterpreter that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    public addGoalImplementation(implementationName: string,
                                 goal: Goal,
                                 goalExecutor: ExecuteGoalWithLog,
                                 options?: Partial<{
                                     pushTest: PushTest,
                                     logInterpreter: LogInterpreter,
                                 }>): this {
        const optsToUse = {
            pushTest: AnyPush,
            logInterpreter: lastLinesLogInterpreter(implementationName, 10),
            ...options,
        };
        this.goalFulfillmentMapper.addImplementation({
            implementationName, goal, goalExecutor,
            pushTest: optsToUse.pushTest,
            logInterpreter: optsToUse.logInterpreter,
        });
        this.goalRetryCommandMap[goal.uniqueCamelCaseName] = () => triggerGoal(goal.uniqueCamelCaseName, goal);
        return this;
    }

    private get goalRetryCommands(): Array<Maker<HandleCommand<any>>> {
        return Object.keys(this.goalRetryCommandMap).map(k => this.goalRetryCommandMap[k]);
    }

    public addDisposalRules(...goalSetters: GoalSetter[]): this {
        this.disposalGoalSetters.push(...goalSetters);
        return this;
    }

    private get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(...this.repoCreationListeners) :
            undefined;
    }

    private get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return () => new OnFirstPushToRepo(this.newRepoWithCodeActions);
    }

    private get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceListeners.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceListeners) :
            undefined;
    }

    private get goalSetting(): FunctionalUnit {
        if (this.goalSetters.length === 0) {
            logger.warn("No goal setters");
            return undefined;
        }
        return {
            eventHandlers: [() => new SetGoalsOnPush(this.opts.projectLoader, this.goalSetters, this.goalsSetListeners,
                this.goalFulfillmentMapper)],
            commandHandlers: [() => resetGoalsCommand({
                projectLoader: this.opts.projectLoader,
                goalsListeners: this.goalsSetListeners,
                goalSetters: this.goalSetters,
                implementationMapping: this.goalFulfillmentMapper,
            })],
        };
    }

    private readonly oldPushSuperseder: Maker<SetSupersededStatus> = SetSupersededStatus;

    get onSuperseded(): Maker<OnSupersededStatus> {
        return this.supersededListeners.length > 0 ?
            () => new OnSupersededStatus(...this.supersededListeners) :
            undefined;
    }

    private get goalConsequences(): FunctionalUnit {
        return {
            eventHandlers: [
                () => new FailDownstreamGoalsOnGoalFailure(),
                () => new RequestDownstreamGoalsOnGoalSuccess(),
                () => new CopyStatusApprovalToGoal(),
            ],
            commandHandlers: [],
        };
    }

    private readonly artifactFinder = () => new FindArtifactOnImageLinked(ArtifactGoal,
        this.opts.artifactStore,
        ...this.artifactListeners)

    private get notifyOnDeploy(): Maker<OnDeployStatus> {
        return this.deploymentListeners.length > 0 ?
            () => new OnDeployStatus(...this.deploymentListeners) :
            undefined;
    }

    private addVerifyImplementation(): this {
        const stagingVerification: SdmVerification = {
            verifiers: this.endpointVerificationListeners,
            endpointGoal: StagingEndpointGoal,
            requestApproval: true,
        };
        return this.addGoalImplementation("VerifyInStaging",
            StagingVerifiedGoal,
            executeVerifyEndpoint(stagingVerification));
    }

    private get onVerifiedStatus(): Maker<OnVerifiedDeploymentStatus> {
        return this.verifiedDeploymentListeners.length > 0 ?
            () => new OnVerifiedDeploymentStatus(...this.verifiedDeploymentListeners) :
            undefined;
    }

    private get disposal(): FunctionalUnit {
        return {
            commandHandlers: [
                () => disposeCommand({
                    goalSetters: this.disposalGoalSetters,
                    projectLoader: this.opts.projectLoader,
                    goalsListeners: this.goalsSetListeners,
                    implementationMapping: this.goalFulfillmentMapper,
                }),
                deleteRepositoryCommand],
            eventHandlers: [],
        };
    }

    private readonly onBuildComplete: Maker<SetGoalOnBuildComplete> =
        () => new SetGoalOnBuildComplete([BuildGoal, JustBuildGoal])

    get showBuildLog(): Maker<HandleCommand> {
        return () => {
            return displayBuildLogHandler();
        };
    }

    private get allFunctionalUnits(): FunctionalUnit[] {
        return this.functionalUnits
            .concat([
                this.goalSetting,
                this.goalConsequences,
                this.disposal,
            ]);
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return this.supportingEvents
            .concat(() => new FulfillGoalOnRequested(this.goalFulfillmentMapper, this.opts.projectLoader))
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.eventHandlers)))
            .concat([
                this.newIssueListeners.length > 0 ? () => new NewIssueHandler(...this.newIssueListeners) : undefined,
                this.updatedIssueListeners.length > 0 ? () => new UpdatedIssueHandler(...this.updatedIssueListeners) : undefined,
                this.closedIssueListeners.length > 0 ? () => new ClosedIssueHandler(...this.closedIssueListeners) : undefined,
                this.channelLinkListeners.length > 0 ? () => new OnChannelLink(this.opts.projectLoader, this.channelLinkListeners) : undefined,
                this.pullRequestListeners.length > 0 ? () => new OnPullRequest(this.opts.projectLoader, this.pullRequestListeners) : undefined,
                this.onRepoCreation,
                this.onNewRepoWithCode,
                this.semanticDiffReactor,
                this.oldPushSuperseder,
                this.onSuperseded,
                this.onBuildComplete,
                this.notifyOnDeploy,
                this.onVerifiedStatus,
                this.artifactFinder,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.generators
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.commandHandlers)))
            .concat(this.goalRetryCommands)
            .concat(this.editors)
            .concat(this.supportingCommands)
            .concat([this.showBuildLog])
            .filter(m => !!m);
    }

    public addGenerators(...g: Array<Maker<HandleCommand>>): this {
        this.generators = this.generators.concat(g);
        return this;
    }

    public addEditors(...e: Array<Maker<HandleCommand>>): this {
        this.editors = this.editors.concat(e);
        return this;
    }

    public addSupportingCommands(...e: Array<Maker<HandleCommand>>): this {
        this.supportingCommands.push(...e);
        return this;
    }

    public addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this {
        this.supportingEvents.push(...e);
        return this;
    }

    public addFunctionalUnits(...fus: FunctionalUnit[]): this {
        this.functionalUnits.push(...fus);
        return this;
    }

    public addBuildRules(...rules: Array<PushRule<Builder>>): this {
        rules.forEach(r =>
            this.addGoalImplementation(r.name, BuildGoal,
                executeBuild(this.opts.projectLoader, r.choice.value),
                {
                    pushTest: r.choice.guard,
                    logInterpreter: r.choice.value.logInterpreter,
                })
                .addGoalImplementation(r.name, JustBuildGoal,
                    executeBuild(this.opts.projectLoader, r.choice.value),
                    {
                        pushTest: r.choice.guard,
                        logInterpreter:
                        r.choice.value.logInterpreter,
                    },
                ));
        return this;
    }

    public addDeployRules(...rules: Array<StaticPushMapping<Target>>): this {
        rules.forEach(r => {
            // deploy
            this.addGoalImplementation(r.name, r.value.deployGoal, executeDeploy(this.opts.artifactStore,
                r.value.endpointGoal, r.value),
                {
                    pushTest: r.guard,
                    logInterpreter: r.value.deployer.logInterpreter,
                },
            );
            // endpoint
            this.knownSideEffect(
                r.value.endpointGoal,
                r.value.deployGoal.definition.displayName);
            // undeploy
            this.addGoalImplementation(r.name, r.value.undeployGoal, executeUndeploy(r.value),
                {
                    pushTest: r.guard,
                    logInterpreter: r.value.deployer.logInterpreter,
                },
            );
        });
        return this;
    }

    /**
     * Declare that a goal will become successful based on something outside.
     * For instance, ArtifactGoal succeeds because of an ImageLink event.
     * This tells the SDM that it does not need to run anything when this
     * goal becomes ready.
     * @param {Goal} goal
     * @param {string} sideEffectName
     * @param {PushTest} pushTest
     */
    public knownSideEffect(goal: Goal, sideEffectName: string,
                           pushTest: PushTest = AnyPush) {
        this.goalFulfillmentMapper.addSideEffect({
            goal,
            sideEffectName, pushTest,
        });
    }

    /**
     *
     * @param {string} name
     * @param {SoftwareDeliveryMachineOptions} opts
     * @param {GoalSetter} goalSetters tell me what to do on a push. Hint: start with "whenPushSatisfies(...)"
     */
    constructor(public readonly name: string,
                public readonly opts: SoftwareDeliveryMachineOptions,
                ...goalSetters: GoalSetter[]) {
        super();
        this.goalSetters = goalSetters;
        addGitHubSupport(this);
        this.addSupportingCommands(
            selfDescribeHandler(this),
            listGeneratorsHandler(this),
            createRepoHandler(this),
        );

        this.addGoalImplementation("Autofix", AutofixGoal,
            executeAutofixes(this.opts.projectLoader, this.autofixRegistrations), {
                // Autofix errors should not be reported to the user
                logInterpreter: LogSuppressor,
            })
            .addGoalImplementation("DoNothing", NoGoal, executeImmaterial)
            .addGoalImplementation("FingerprinterRegistration", FingerprintGoal,
                executeFingerprinting(this.opts.projectLoader, ...this.fingerprinterRegistrations))
            .addGoalImplementation("CodeReactions", CodeReactionGoal,
                executeCodeReactions(this.opts.projectLoader, this.codeReactionRegistrations))
            .addGoalImplementation("Reviews", ReviewGoal,
                executeReview(this.opts.projectLoader, this.reviewerRegistrations))
            .addVerifyImplementation()
            .addGoalImplementation("OfferToDeleteRepo", DeleteRepositoryGoal,
                offerToDeleteRepository())
            .addGoalImplementation("OfferToDeleteRepoAfterUndeploys", DeleteAfterUndeploysGoal,
                offerToDeleteRepository());
        this.knownSideEffect(ArtifactGoal, "from ImageLinked");
    }

}

function addGitHubSupport(sdm: SoftwareDeliveryMachine) {
    sdm.addSupportingEvents(CopyGoalToGitHubStatus);
}
