import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { ProjectListener } from "../common/listener/Listener";
import { NewIssueListener } from "../common/listener/NewIssueListener";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/FindArtifactOnImageLinked";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamGoalsOnGoalFailure } from "../handlers/events/delivery/FailDownstreamGoalsOnGoalFailure";
import {
    ArtifactGoal,
    AutofixGoal,
    BuildGoal,
    CodeReactionGoal,
    FingerprintGoal,
    ReviewGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
} from "../handlers/events/delivery/goals/httpServiceGoals";
import { FingerprintOnPendingStatus } from "../handlers/events/delivery/scan/fingerprint/FingerprintOnPendingStatus";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/delivery/scan/fingerprint/ReactToSemanticDiffsOnPushImpact";
import {
    EndpointVerificationListener,
    OnEndpointStatus,
    retryVerifyCommand,
    SdmVerification,
} from "../handlers/events/delivery/verify/OnEndpointStatus";
import { OnVerifiedDeploymentStatus } from "../handlers/events/delivery/verify/OnVerifiedDeploymentStatus";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { OnRepoCreation } from "../handlers/events/repo/OnRepoCreation";
import { OnSuccessStatus } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";
import { ReferenceDeliveryBlueprint } from "./ReferenceDeliveryBlueprint";

import * as _ from "lodash";
import { ArtifactListener } from "../common/listener/ArtifactListener";
import { ClosedIssueListener } from "../common/listener/ClosedIssueListener";
import { CodeReactionListener } from "../common/listener/CodeReactionListener";
import { DeploymentListener } from "../common/listener/DeploymentListener";
import { FingerprintDifferenceListener } from "../common/listener/FingerprintDifferenceListener";
import { Fingerprinter } from "../common/listener/Fingerprinter";
import { GoalSetter } from "../common/listener/GoalSetter";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";
import { SupersededListener } from "../common/listener/SupersededListener";
import { UpdatedIssueListener } from "../common/listener/UpdatedIssueListener";
import { VerifiedDeploymentListener } from "../common/listener/VerifiedDeploymentListener";
import { displayBuildLogHandler } from "../handlers/commands/ShowBuildLog";
import { BuildOnPendingBuildStatus, ConditionalBuilder } from "../handlers/events/delivery/build/BuildOnPendingBuildStatus";
import { SetGoalsOnPush } from "../handlers/events/delivery/goals/SetGoalsOnPush";
import { OnPendingAutofixStatus } from "../handlers/events/delivery/scan/review/OnPendingAutofixStatus";
import { OnPendingCodeReactionStatus } from "../handlers/events/delivery/scan/review/OnPendingCodeReactionStatus";
import { OnPendingReviewStatus } from "../handlers/events/delivery/scan/review/OnPendingReviewStatus";
import { OnSupersededStatus } from "../handlers/events/delivery/superseded/OnSuperseded";
import { SetSupersededStatus } from "../handlers/events/delivery/superseded/SetSupersededStatus";
import { ClosedIssueHandler } from "../handlers/events/issue/ClosedIssueHandler";
import { NewIssueHandler } from "../handlers/events/issue/NewIssueHandler";
import { UpdatedIssueHandler } from "../handlers/events/issue/UpdatedIssueHandler";
import { ArtifactStore } from "../spi/artifact/ArtifactStore";
import { IssueHandling } from "./IssueHandling";
import { NewRepoHandling } from "./NewRepoHandling";
import { PushRule } from "./ruleDsl";

/**
 * A reference blueprint for Atomist delivery.
 * Represents a possible delivery process spanning
 * goals of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment.
 * Uses the builder pattern.
 */
export class SoftwareDeliveryMachine implements NewRepoHandling, ReferenceDeliveryBlueprint, IssueHandling {

    public generators: Array<Maker<HandleCommand>> = [];

    public editors: Array<Maker<HandleCommand>> = [];

    public supportingCommands: Array<Maker<HandleCommand>> = [];

    public supportingEvents: Array<Maker<HandleEvent<any>>> = [];

    public functionalUnits: FunctionalUnit[] = [];

    public newIssueListeners: NewIssueListener[] = [];

    public updatedIssueListeners: UpdatedIssueListener[] = [];

    public closedIssueListeners: ClosedIssueListener[] = [];

    public repoCreationListeners: RepoCreationListener[] = [];

    public newRepoWithCodeActions: ProjectListener[] = [];

    private readonly deployers: Array<FunctionalUnit>;

    private readonly goalSetters: GoalSetter[] = [];

    private readonly conditionalBuilders: ConditionalBuilder[] = [];

    private projectReviewers: ProjectReviewer[] = [];

    private codeReactions: CodeReactionListener[] = [];

    private autoEditors: AnyProjectEditor[] = [];

    private artifactListeners: ArtifactListener[] = [];

    private fingerprinters: Fingerprinter[] = [];

    private supersededListeners: SupersededListener[] = [];

    private fingerprintDifferenceListeners: FingerprintDifferenceListener[] = [];

    private deploymentListeners?: DeploymentListener[] = [];

    private verifiedDeploymentListeners: VerifiedDeploymentListener[] = [];

    private endpointVerificationListeners: EndpointVerificationListener[] = [];

    private get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(...this.repoCreationListeners) :
            undefined;
    }

    private get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return () => new OnFirstPushToRepo(this.newRepoWithCodeActions);
    }

    private get fingerprinter(): Maker<FingerprintOnPendingStatus> {
        return this.fingerprinters.length > 0 ?
            () => new FingerprintOnPendingStatus(FingerprintGoal, this.fingerprinters) :
            undefined;
    }

    private get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceListeners.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceListeners) :
            undefined;
    }

    private get reviewHandler(): Maker<OnPendingReviewStatus> {
        return () => new OnPendingReviewStatus(ReviewGoal, this.projectReviewers);
    }

    private get codeReactionsHandler(): Maker<OnPendingCodeReactionStatus> {
        return () => new OnPendingCodeReactionStatus(CodeReactionGoal, this.codeReactions);
    }

    private get autofixHandler(): Maker<OnPendingAutofixStatus> {
        return () => new OnPendingAutofixStatus(AutofixGoal, this.autoEditors);
    }

    private get goalSetting(): Maker<SetGoalsOnPush> {
        if (this.goalSetters.length === 0) {
            throw new Error("No goal setters");
        }
        return () => new SetGoalsOnPush(...this.goalSetters);
    }

    private oldPushSuperseder: Maker<SetSupersededStatus> = SetSupersededStatus;

    private get builder(): FunctionalUnit {
        return {
            eventHandlers: [() => new BuildOnPendingBuildStatus(BuildGoal, this.conditionalBuilders)],
            commandHandlers: []
        };
    }

    get onSuperseded(): Maker<OnSupersededStatus> {
        return this.supersededListeners.length > 0 ?
            () => new OnSupersededStatus(...this.supersededListeners) :
            undefined;
    }

    private get goalCleanup(): Array<Maker<FailDownstreamGoalsOnGoalFailure>> {
        return [() => new FailDownstreamGoalsOnGoalFailure()];
    }

    private artifactFinder = () => new FindArtifactOnImageLinked(ArtifactGoal,
        this.opts.artifactStore,
        ...this.artifactListeners)

    private get notifyOnDeploy(): Maker<OnDeployStatus> {
        return this.deploymentListeners.length > 0 ?
            () => new OnDeployStatus(...this.deploymentListeners) :
            undefined;
    }

    private get verifyEndpoint(): FunctionalUnit {
        if (this.endpointVerificationListeners.length === 0) {
            return {eventHandlers: [], commandHandlers: []};
        }
        const stagingVerification: SdmVerification = {
            verifiers: this.endpointVerificationListeners,
            verifyGoal: StagingVerifiedGoal,
            requestApproval: true,
        };
        return {
            eventHandlers: [() => new OnEndpointStatus(StagingEndpointGoal, stagingVerification)],
            commandHandlers: [() => retryVerifyCommand(stagingVerification)],
        };
    }

    private get onVerifiedStatus(): Maker<OnVerifiedDeploymentStatus> {
        return this.verifiedDeploymentListeners.length > 0 ?
            () => new OnVerifiedDeploymentStatus(...this.verifiedDeploymentListeners) :
            undefined;
    }

    private onBuildComplete: Maker<SetStatusOnBuildComplete> =
        () => new SetStatusOnBuildComplete(BuildGoal)

    get showBuildLog(): Maker<HandleCommand> {
        return () => {
            return displayBuildLogHandler();
        };
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return (this.goalCleanup as Array<Maker<HandleEvent<any>>>)
            .concat(this.supportingEvents)
            .concat(_.flatten(this.functionalUnits.map(fu => fu.eventHandlers)))
            .concat(_.flatten(this.opts.deployers.map(fu => fu.eventHandlers)))
            .concat(this.builder.eventHandlers)
            .concat(this.verifyEndpoint.eventHandlers)
            .concat([
                this.newIssueListeners.length > 0 ? () => new NewIssueHandler(...this.newIssueListeners) : undefined,
                this.updatedIssueListeners.length > 0 ? () => new UpdatedIssueHandler(...this.updatedIssueListeners) : undefined,
                this.closedIssueListeners.length > 0 ? () => new ClosedIssueHandler(...this.closedIssueListeners) : undefined,
                this.onRepoCreation,
                this.onNewRepoWithCode,
                this.fingerprinter,
                this.semanticDiffReactor,
                this.autofixHandler,
                this.reviewHandler,
                this.codeReactionsHandler,
                this.goalSetting,
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
            .concat(this.editors)
            .concat(this.supportingCommands)
            .concat(_.flatten(this.functionalUnits.map(fu => fu.commandHandlers)))
            .concat(_.flatten(this.opts.deployers.map(fu => fu.commandHandlers)))
            .concat(this.builder.commandHandlers)
            .concat([this.showBuildLog])
            .concat(this.verifyEndpoint.commandHandlers)
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

    public addNewIssueListeners(...e: NewIssueListener[]): this {
        this.newIssueListeners = this.newIssueListeners.concat(e);
        return this;
    }

    public addUpdatedIssueListeners(...e: UpdatedIssueListener[]): this {
        this.updatedIssueListeners = this.updatedIssueListeners.concat(e);
        return this;
    }

    public addClosedIssueListeners(...e: ClosedIssueListener[]): this {
        this.closedIssueListeners = this.closedIssueListeners.concat(e);
        return this;
    }

    public addSupportingCommands(...e: Array<Maker<HandleCommand>>): this {
        this.supportingCommands = this.supportingCommands.concat(e);
        return this;
    }

    public addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this {
        this.supportingEvents = this.supportingEvents.concat(e);
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
        this.repoCreationListeners = this.repoCreationListeners.concat(rcls);
        return this;
    }

    public addNewRepoWithCodeActions(...pls: ProjectListener[]): this {
        this.newRepoWithCodeActions = this.newRepoWithCodeActions.concat(pls);
        return this;
    }

    public addProjectReviewers(...reviewers: ProjectReviewer[]): this {
        this.projectReviewers = this.projectReviewers.concat(reviewers);
        return this;
    }

    public addCodeReactions(...pls: CodeReactionListener[]): this {
        this.codeReactions = this.codeReactions.concat(pls);
        return this;
    }

    public addArtifactListeners(...pls: ArtifactListener[]): this {
        this.artifactListeners = this.artifactListeners.concat(pls);
        return this;
    }

    /**
     * Editors automatically invoked on eligible commits.
     * Note: be sure that these editors check and don't call
     * infinite recursion!!
     */
    public addAutoEditors(...e: AnyProjectEditor[]): this {
        this.autoEditors = this.autoEditors.concat(e);
        return this;
    }

    public addFingerprinters(...f: Fingerprinter[]): this {
        this.fingerprinters = this.fingerprinters.concat(f);
        return this;
    }

    public addSupersededListeners(...l: SupersededListener[]): this {
        this.supersededListeners = this.supersededListeners.concat(l);
        return this;
    }

    public addFingerprintDifferenceListeners(...fh: FingerprintDifferenceListener[]): this {
        this.fingerprintDifferenceListeners = this.fingerprintDifferenceListeners.concat(fh);
        return this;
    }

    public addDeploymentListeners(...l: DeploymentListener[]): this {
        this.deploymentListeners = this.deploymentListeners.concat(l);
        return this;
    }

    public addVerifiedDeploymentListeners(...l: VerifiedDeploymentListener[]): this {
        this.verifiedDeploymentListeners = this.verifiedDeploymentListeners.concat(l);
        return this;
    }

    public addEndpointVerificationListeners(...l: EndpointVerificationListener[]): this {
        this.endpointVerificationListeners = this.endpointVerificationListeners.concat(l);
        return this;
    }

    public addFunctionalUnits(fus: FunctionalUnit[]): this {
        this.functionalUnits = this.functionalUnits.concat(fus);
        return this;
    }

    constructor(private opts: {
                    deployers: Array<FunctionalUnit>,
                    artifactStore: ArtifactStore,
                },
                ...pushRules: PushRule[]) {
        this.goalSetters = pushRules
            .filter(rule => !!rule.goalSetter)
            .map(rule => rule.goalSetter);
        this.conditionalBuilders = pushRules
            .filter(rule => !!rule.builder)
            .map(rule => ({guard: rule.pushTest, builder: rule.builder}));
    }

}
