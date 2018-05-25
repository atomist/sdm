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

// tslint:disable:max-file-line-count

import { Configuration, HandleCommand, HandleEvent, logger } from "@atomist/automation-client";
import { guid } from "@atomist/automation-client/internal/util/string";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { createRepoHandler } from "../common/command/generator/createRepo";
import { listGeneratorsHandler } from "../common/command/generator/listGenerators";
import { executeBuild } from "../common/delivery/build/executeBuild";
import { executeAutofixes } from "../common/delivery/code/autofix/executeAutofixes";
import { executePushReactions } from "../common/delivery/code/executePushReactions";
import { executeFingerprinting } from "../common/delivery/code/fingerprint/executeFingerprinting";
import { executeReview } from "../common/delivery/code/review/executeReview";
import { Target } from "../common/delivery/deploy/deploy";
import { executeDeploy } from "../common/delivery/deploy/executeDeploy";
import { executeUndeploy, offerToDeleteRepository } from "../common/delivery/deploy/executeUndeploy";
import {
    ArtifactGoal,
    AutofixGoal,
    BuildGoal,
    DeleteAfterUndeploysGoal,
    DeleteRepositoryGoal,
    FingerprintGoal,
    JustBuildGoal,
    NoGoal,
    PushReactionGoal,
    ReviewGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
} from "../common/delivery/goals/common/commonGoals";
import { Goal } from "../common/delivery/goals/Goal";
import { Goals } from "../common/delivery/goals/Goals";
import { SdmGoalImplementationMapper } from "../common/delivery/goals/SdmGoalImplementationMapper";
import { lastLinesLogInterpreter, LogSuppressor } from "../common/delivery/goals/support/logInterpreters";
import { ExecuteGoalWithLog } from "../common/delivery/goals/support/reportGoalError";
import { GoalSetter } from "../common/listener/GoalSetter";
import { PushMapping } from "../common/listener/PushMapping";
import { PushTest } from "../common/listener/PushTest";
import { PushRule } from "../common/listener/support/PushRule";
import { PushRules } from "../common/listener/support/PushRules";
import { AnyPush } from "../common/listener/support/pushtest/commonPushTests";
import { StaticPushMapping } from "../common/listener/support/StaticPushMapping";
import { deleteRepositoryCommand } from "../handlers/commands/deleteRepository";
import { disposeCommand } from "../handlers/commands/disposeCommand";
import { selfDescribeHandler } from "../handlers/commands/SelfDescribe";
import { displayBuildLogHandler } from "../handlers/commands/ShowBuildLog";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/FindArtifactOnImageLinked";
import { InvokeListenersOnBuildComplete } from "../handlers/events/delivery/build/InvokeListenersOnBuildComplete";
import { SetGoalOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/delivery/code/ReactToSemanticDiffsOnPushImpact";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FulfillGoalOnRequested } from "../handlers/events/delivery/goals/FulfillGoalOnRequested";
import { KubernetesIsolatedGoalLauncher } from "../handlers/events/delivery/goals/k8s/launchGoalK8";
import { GoalAutomationEventListener } from "../handlers/events/delivery/goals/launchGoal";
import { RequestDownstreamGoalsOnGoalSuccess } from "../handlers/events/delivery/goals/RequestDownstreamGoalsOnGoalSuccess";
import { resetGoalsCommand } from "../handlers/events/delivery/goals/resetGoals";
import { RespondOnGoalCompletion } from "../handlers/events/delivery/goals/RespondOnGoalCompletion";
import { executeImmaterial, SetGoalsOnPush } from "../handlers/events/delivery/goals/SetGoalsOnPush";
import { SkipDownstreamGoalsOnGoalFailure } from "../handlers/events/delivery/goals/SkipDownstreamGoalsOnGoalFailure";
import { executeVerifyEndpoint, SdmVerification } from "../handlers/events/delivery/verify/executeVerifyEndpoint";
import { OnVerifiedDeploymentStatus } from "../handlers/events/delivery/verify/OnVerifiedDeploymentStatus";
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
import { Builder } from "../spi/build/Builder";
import { InterpretLog } from "../spi/log/InterpretedLog";
import { EmptyFunctionalUnit, FunctionalUnit } from "./FunctionalUnit";
import { ReferenceDeliveryBlueprint } from "./ReferenceDeliveryBlueprint";
import { softwareDeliveryMachineOptions } from "./sdmOptions";
import { SoftwareDeliveryMachineConfigurer } from "./SoftwareDeliveryMachineConfigurer";
import { SoftwareDeliveryMachineOptions } from "./SoftwareDeliveryMachineOptions";
import { ListenerRegistrations } from "./support/ListenerRegistrations";

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

    // Maintained depending on whether this SDM might mutate
    private mightMutate: boolean = false;

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    get pushMapping(): PushMapping<Goals> {
        return new PushRules("Goal setter", this.goalSetters);
    }

    /**
     * Return if this SDM purely observes, rather than changes an org.
     * Note that this cannot be 100% reliable, as arbitrary event handlers
     * could be making commits, initiating deployments etc.
     * @return {boolean}
     */
    get observesOnly(): boolean {
        if (this.mightMutate) {
            return false;
        }
        return this.autofixRegistrations.length === 0;
    }

    /*
     * Store all the implementations we know
     */
    public readonly goalFulfillmentMapper = new SdmGoalImplementationMapper(
        // For now we only support kube or in process
        process.env.ATOMIST_GOAL_LAUNCHER === "kubernetes" ? KubernetesIsolatedGoalLauncher : undefined); // public for testing

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoalWithLog} goalExecutor
     * @param options PushTest to narrow matching & InterpretLog that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    public addGoalImplementation(implementationName: string,
                                 goal: Goal,
                                 goalExecutor: ExecuteGoalWithLog,
                                 options?: Partial<{
                                     pushTest: PushTest,
                                     logInterpreter: InterpretLog,
                                 }>): this {
        const optsToUse = {
            pushTest: AnyPush,
            logInterpreter: lastLinesLogInterpreter(implementationName, 10),
            ...options,
        };
        const implementation = {
            implementationName, goal, goalExecutor,
            pushTest: optsToUse.pushTest,
            logInterpreter: optsToUse.logInterpreter,
        };
        this.goalFulfillmentMapper.addImplementation(implementation);
        return this;
    }

    public addDisposalRules(...goalSetters: GoalSetter[]): this {
        this.disposalGoalSetters.push(...goalSetters);
        return this;
    }

    private get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(this.repoCreationListeners, this.opts.credentialsResolver) :
            undefined;
    }

    private get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return this.newRepoWithCodeActions.length > 0 ?
            () => new OnFirstPushToRepo(this.newRepoWithCodeActions, this.opts.credentialsResolver) :
            undefined;
    }

    private get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceListeners.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceListeners, this.opts.credentialsResolver) :
            undefined;
    }

    private get goalSetting(): FunctionalUnit {
        if (this.goalSetters.length === 0) {
            logger.warn("No goal setters");
            return EmptyFunctionalUnit;
        }
        return {
            eventHandlers: [() => new SetGoalsOnPush(this.opts.projectLoader,
                this.goalSetters, this.goalsSetListeners,
                this.goalFulfillmentMapper, this.opts.credentialsResolver)],
            commandHandlers: [() => resetGoalsCommand({
                projectLoader: this.opts.projectLoader,
                goalsListeners: this.goalsSetListeners,
                goalSetters: this.goalSetters,
                implementationMapping: this.goalFulfillmentMapper,
            })],
        };
    }

    private get goalConsequences(): FunctionalUnit {
        return {
            eventHandlers: [
                () => new SkipDownstreamGoalsOnGoalFailure(),
                () => new RequestDownstreamGoalsOnGoalSuccess(this.goalFulfillmentMapper),
                () => new RespondOnGoalCompletion(this.opts.credentialsResolver,
                    this.goalCompletionListeners)],
            commandHandlers: [],
        };
    }

    private readonly artifactFinder = () => new FindArtifactOnImageLinked(
        ArtifactGoal,
        this.opts.artifactStore,
        this.artifactListenerRegistrations,
        this.opts.projectLoader,
        this.opts.credentialsResolver)

    private get notifyOnDeploy(): Maker<OnDeployStatus> {
        return this.deploymentListeners.length > 0 ?
            () => new OnDeployStatus(this.deploymentListeners, this.opts.credentialsResolver) :
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
            () => new OnVerifiedDeploymentStatus(this.verifiedDeploymentListeners, this.opts.credentialsResolver) :
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
            .concat(() => new FulfillGoalOnRequested(this.goalFulfillmentMapper, this.opts.projectLoader, this.opts.logFactory))
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.eventHandlers)))
            .concat([
                this.userJoiningChannelListeners.length > 0 ?
                    () => new OnUserJoiningChannel(this.userJoiningChannelListeners, this.opts.credentialsResolver) :
                    undefined,
                this.buildListeners.length > 0 ?
                    () => new InvokeListenersOnBuildComplete(this.buildListeners, this.opts.credentialsResolver) :
                    undefined,
                this.tagListeners.length > 0 ? () => new OnTag(this.tagListeners, this.opts.credentialsResolver) : undefined,
                this.newIssueListeners.length > 0 ? () => new NewIssueHandler(this.newIssueListeners, this.opts.credentialsResolver) : undefined,
                this.updatedIssueListeners.length > 0 ?
                    () => new UpdatedIssueHandler(this.updatedIssueListeners, this.opts.credentialsResolver) :
                    undefined,
                this.closedIssueListeners.length > 0 ?
                    () => new ClosedIssueHandler(this.closedIssueListeners, this.opts.credentialsResolver) :
                    undefined,
                this.channelLinkListeners.length > 0 ?
                    () => new OnChannelLink(this.opts.projectLoader, this.channelLinkListeners, this.opts.credentialsResolver) :
                    undefined,
                this.pullRequestListeners.length > 0 ?
                    () => new OnPullRequest(this.opts.projectLoader, this.pullRequestListeners,
                        this.opts.credentialsResolver) : undefined,
                this.repoOnboardingListeners.length > 0 ?
                    () => new OnRepoOnboarded(this.repoOnboardingListeners, this.opts.credentialsResolver) :
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
        return this.generators
            .concat(_.flatten(this.allFunctionalUnits.map(fu => fu.commandHandlers)))
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

    public addBuildRules(...rules: Array<PushRule<Builder> | Array<PushRule<Builder>>>): this {
        this.mightMutate = rules.length > 0;
        _.flatten(rules).forEach(r =>
            this.addGoalImplementation(r.name, BuildGoal,
                executeBuild(this.opts.projectLoader, r.value),
                {
                    pushTest: r.pushTest,
                    logInterpreter: r.value.logInterpreter,
                })
                .addGoalImplementation(r.name, JustBuildGoal,
                    executeBuild(this.opts.projectLoader, r.value),
                    {
                        pushTest: r.pushTest,
                        logInterpreter:
                        r.value.logInterpreter,
                    },
                ));
        return this;
    }

    public addDeployRules(...rules: Array<StaticPushMapping<Target> | Array<StaticPushMapping<Target>>>): this {
        this.mightMutate = rules.length > 0;
        _.flatten(rules).forEach(r => {
            // deploy
            this.addGoalImplementation(r.name, r.value.deployGoal, executeDeploy(this.opts.artifactStore,
                r.value.endpointGoal, r.value),
                {
                    pushTest: r.pushTest,
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
                    pushTest: r.pushTest,
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
     * Add the given capabilities from these configurers
     * @param {SoftwareDeliveryMachineConfigurer} configurers
     * @return {this}
     */
    public addCapabilities(...configurers: SoftwareDeliveryMachineConfigurer[]): this {
        for (const configurer of configurers) {
            this.configure(configurer);
        }
        return this;
    }

    public configure(configurer: SoftwareDeliveryMachineConfigurer): this {
        logger.info("Adding capabilities from configurer '%s'", configurer.name);
        configurer.configure(this);
        return this;
    }

    /**
     *
     * @param {string} name
     * @param {SoftwareDeliveryMachineOptions} opts
     * @param {GoalSetter} goalSetters tell me what to do on a push. Hint: start with "whenPushSatisfies(...)"
     */
    constructor(public readonly name: string,
                public readonly opts: SoftwareDeliveryMachineOptions,
                ...goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super();
        this.goalSetters = _.flatten(goalSetters);
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
                executeFingerprinting(this.opts.projectLoader, this.fingerprinterRegistrations, this.fingerprintListeners))
            .addGoalImplementation("CodeReactions", PushReactionGoal,
                executePushReactions(this.opts.projectLoader, this.pushReactionRegistrations))
            .addGoalImplementation("Reviews", ReviewGoal,
                executeReview(this.opts.projectLoader, this.reviewerRegistrations, this.reviewListeners))
            .addVerifyImplementation()
            .addGoalImplementation("OfferToDeleteRepo", DeleteRepositoryGoal,
                offerToDeleteRepository())
            .addGoalImplementation("OfferToDeleteRepoAfterUndeploys", DeleteAfterUndeploysGoal,
                offerToDeleteRepository());
        this.knownSideEffect(ArtifactGoal, "from ImageLinked");
    }

}

export interface ConfigureOptions {
    sdmOptions?: Partial<SoftwareDeliveryMachineOptions>;
    requiredConfigurationValues?: string[];
}

export function configureSdm(
    machineMaker: (options: SoftwareDeliveryMachineOptions, configuration: Configuration) => SoftwareDeliveryMachine,
    options: ConfigureOptions = {}) {
    return async (config: Configuration) => {
        const sdmOptions = {
            ...softwareDeliveryMachineOptions(config),
            ...(options.sdmOptions ? options.sdmOptions : {}),
        };
        const machine = machineMaker(sdmOptions, config);

        const forked = process.env.ATOMIST_ISOLATED_GOAL === "true";
        if (forked) {
            config.listeners.push(
                new GoalAutomationEventListener(machine.goalFulfillmentMapper, machine.opts.projectLoader, machine.opts.logFactory));
            config.name = `${config.name}-${process.env.ATOMIST_GOAL_ID || guid()}`;
            // force ephemeral policy and no handlers or ingesters
            config.policy = "ephemeral";
            config.commands = [];
            config.events = [];
            config.ingesters = [];

            // Disable app events for forked clients
            config.applicationEvents.enabled = false;
        } else {
            const missingValues = [];
            (options.requiredConfigurationValues || []).forEach(v => {
                if (!_.get(config, v)) {
                    missingValues.push(v);
                }
            });
            if (missingValues.length > 0) {
                throw new Error(
                    `Missing configuration values. Please add the following values to your client configuration: '${missingValues.join(", ")}'`);
            }

            if (!config.commands) {
                config.commands = [];
            }
            config.commands.push(...machine.commandHandlers);

            if (!config.events) {
                config.events = [];
            }
            config.events.push(...machine.eventHandlers);
        }
        return config;
    };
}
