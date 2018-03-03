import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { ProjectListener } from "../common/listener/Listener";
import { NewIssueListener } from "../common/listener/NewIssueListener";
import { EventWithCommand } from "../handlers/commands/RetryDeploy";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/FindArtifactOnImageLinked";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { OnSupersededStatus } from "../handlers/events/delivery/phase/OnSuperseded";
import { SetSupersededStatus } from "../handlers/events/delivery/phase/SetSupersededStatus";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { ArtifactContext, BuildPhase, ContextToPlannedPhase, StagingVerifiedContext } from "../handlers/events/delivery/phases/httpServicePhases";
import { FingerprintOnPush } from "../handlers/events/delivery/scan/fingerprint/FingerprintOnPush";
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
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { OnSuccessStatus } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";
import { ReferenceDeliveryBlueprint } from "./ReferenceDeliveryBlueprint";

import * as _ from "lodash";
import { CodeReactionListener } from "../common/listener/CodeReactionListener";
import { DeploymentListener } from "../common/listener/DeploymentListener";
import { FingerprintDifferenceListener } from "../common/listener/FingerprintDifferenceListener";
import { Fingerprinter } from "../common/listener/Fingerprinter";
import { PhaseCreator } from "../common/listener/PhaseCreator";
import { RepoCreationListener } from "../common/listener/RepoCreationListener";
import { SupersededListener } from "../common/listener/SupersededListener";
import { VerifiedDeploymentListener } from "../common/listener/VerifiedDeploymentListener";
import { displayBuildLogHandler } from "../handlers/commands/ShowBuildLog";
import { OnPendingScanStatus } from "../handlers/events/delivery/scan/review/OnPendingScanStatus";
import { OnNewIssue } from "../handlers/events/issue/NewIssueHandler";
import { IssueHandling } from "./IssueHandling";
import { NewRepoHandling } from "./NewRepoHandling";

/**
 * A reference blueprint for Atomist delivery.
 * Represents a possible delivery process spanning
 * phases of fingerprinting, reacting to fingerprint diffs,
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

    public repoCreationListeners: RepoCreationListener[] = [];

    public newRepoWithCodeActions: ProjectListener[] = [];

    private readonly builder: Maker<StatusSuccessHandler>;

    private readonly deployers: Array<Maker<HandleEvent<OnSuccessStatus.Subscription> & EventWithCommand>>;

    private readonly phaseCreators: PhaseCreator[] = [];

    private projectReviewers: ProjectReviewer[] = [];

    private codeReactions: CodeReactionListener[] = [];

    private autoEditors: AnyProjectEditor[] = [];

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

    private get fingerprinter(): Maker<FingerprintOnPush> {
        return this.fingerprinters.length > 0 ?
            () => new FingerprintOnPush(this.fingerprinters) :
            undefined;
    }

    private get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceListeners.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceListeners) :
            undefined;
    }

    private get reviewRunner(): Maker<OnPendingScanStatus> {
        const reviewers = this.projectReviewers;
        const inspections = this.codeReactions;
        const autoEditors = this.autoEditors;
        return (reviewers.length + inspections.length + autoEditors.length > 0) ?
            () => new OnPendingScanStatus(reviewers, inspections, autoEditors) :
            undefined;
    }

    private get phaseSetup(): Maker<SetupPhasesOnPush> {
        if (this.phaseCreators.length === 0) {
            throw new Error("No phase creators");
        }
        return () => new SetupPhasesOnPush(...this.phaseCreators);
    }

    public oldPushSuperseder: Maker<SetSupersededStatus> = SetSupersededStatus;

    get onSuperseded(): Maker<OnSupersededStatus> {
        return this.supersededListeners.length > 0 ?
            () => new OnSupersededStatus(...this.supersededListeners) :
            undefined;
    }

    private get phaseCleanup(): Array<Maker<FailDownstreamPhasesOnPhaseFailure>> {
        return [() => new FailDownstreamPhasesOnPhaseFailure()];
    }

    private artifactFinder = () => new FindArtifactOnImageLinked(ContextToPlannedPhase[ArtifactContext]);

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
            verifyPhase: ContextToPlannedPhase[StagingVerifiedContext],
            requestApproval: true,
        };
        return {
            eventHandlers: [() => new OnEndpointStatus(stagingVerification)],
            commandHandlers: [() => retryVerifyCommand(stagingVerification)],
        };
    }

    private get onVerifiedStatus(): Maker<OnVerifiedDeploymentStatus> {
        return this.verifiedDeploymentListeners.length > 0 ?
            () => new OnVerifiedDeploymentStatus(...this.verifiedDeploymentListeners) :
            undefined;
    }

    private onBuildComplete: Maker<SetStatusOnBuildComplete> =
        () => new SetStatusOnBuildComplete(BuildPhase)

    get showBuildLog(): Maker<HandleCommand> {
        return () => {
            return displayBuildLogHandler();
        };
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return (this.phaseCleanup as Array<Maker<HandleEvent<any>>>)
            .concat(this.supportingEvents)
            .concat(_.flatten(this.functionalUnits.map(fu => fu.eventHandlers)))
            .concat(this.deployers)
            .concat(this.verifyEndpoint.eventHandlers)
            .concat([
                this.newIssueListeners.length > 0 ? () => new OnNewIssue(...this.newIssueListeners) : undefined,
                this.onRepoCreation,
                this.onNewRepoWithCode,
                this.fingerprinter,
                this.semanticDiffReactor,
                this.reviewRunner,
                this.phaseSetup,
                this.oldPushSuperseder,
                this.onSuperseded,
                this.builder,
                this.onBuildComplete,
                this.notifyOnDeploy,
                this.onVerifiedStatus,
                this.artifactFinder,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        const mayHaveCommands: Array<HandleEvent<OnSuccessStatus.Subscription> & EventWithCommand> =
            this.deployers.map(d => toFactory(d)());
        return this.generators
            .concat(this.editors)
            .concat(this.supportingCommands)
            .concat(_.flatten(this.functionalUnits.map(fu => fu.commandHandlers)))
            .concat(mayHaveCommands
                .filter(mhc => !!mhc.correspondingCommand)
                .map(m => () => m.correspondingCommand()))
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

    constructor(opts: {
                    builder: Maker<StatusSuccessHandler>,
                    deployers: Array<Maker<HandleEvent<OnSuccessStatus.Subscription> & EventWithCommand>>,
                },
                ...phaseCreators: PhaseCreator[]) {
        this.builder = opts.builder;
        this.deployers = opts.deployers;
        this.phaseCreators = phaseCreators;
    }

}
