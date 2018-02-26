import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { EventWithCommand } from "../handlers/commands/RetryDeploy";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { DeployListener, OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { ProjectListener, ProjectListenerInvocation, SdmListener } from "../handlers/events/delivery/Listener";
import { OnSupersededStatus, SupersededListenerInvocation } from "../handlers/events/delivery/phase/OnSuperseded";
import { SetSupersededStatus } from "../handlers/events/delivery/phase/SetSupersededStatus";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { BuildContext } from "../handlers/events/delivery/phases/gitHubContext";
import { OnPendingScanStatus } from "../handlers/events/delivery/review/OnPendingScanStatus";
import { EndpointVerificationListener, OnEndpointStatus } from "../handlers/events/delivery/verify/OnEndpointStatus";
import { OnVerifiedStatus, VerifiedDeploymentListener } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { NewIssueInvocation, NewIssueListener, OnNewIssue } from "../handlers/events/issue/NewIssueHandler";
import { OnRepoCreation, RepoCreationListener } from "../handlers/events/repo/OnRepoCreation";
import { Fingerprinter, FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import {
    FingerprintDifferenceHandler,
    ReactToSemanticDiffsOnPushImpact,
} from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { OnImageLinked, OnSuccessStatus } from "../typings/types";
import { PromotedEnvironment } from "./ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Superclass for user software delivery machines
 */
export abstract class AbstractSoftwareDeliveryMachine implements SoftwareDeliveryMachine {

    public generators: Array<Maker<HandleCommand>> = [];

    public editors: Array<Maker<HandleCommand>> = [];

    public supportingCommands: Array<Maker<HandleCommand>> = [];

    public supportingEvents: Array<Maker<HandleEvent<any>>> = [];

    public newIssueListeners: NewIssueListener[] = [];

    private repoCreationListeners: RepoCreationListener[] = [];

    private newRepoWithCodeActions: ProjectListener[] = [];

    private projectReviewers: ProjectReviewer[] = [];

    private codeReactions: ProjectListener[] = [];

    private autoEditors: AnyProjectEditor[] = [];

    private fingerprinters: Fingerprinter[] = [];

    private supersededListeners: Array<SdmListener<SupersededListenerInvocation>> = [];

    private fingerprintDifferenceHandlers: FingerprintDifferenceHandler[] = [];

    private deploymentListeners?: DeployListener[] = [];

    private verifiedDeploymentListeners: VerifiedDeploymentListener[] = [];

    private endpointVerificationListeners: EndpointVerificationListener[] = [];

    /**
     * All possible phases we can set up. Makes cleanup easier.
     */
    protected abstract possiblePhases: Phases[];

    get onRepoCreation(): Maker<OnRepoCreation> {
        return this.repoCreationListeners.length > 0 ?
            () => new OnRepoCreation(...this.repoCreationListeners) :
            undefined;
    }

    public get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return () => new OnFirstPushToRepo(this.newRepoWithCodeActions);
    }

    public get fingerprinter(): Maker<FingerprintOnPush> {
        return this.fingerprinters.length > 0 ?
            () => new FingerprintOnPush(this.fingerprinters) :
            undefined;
    }

    public get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return this.fingerprintDifferenceHandlers.length > 0 ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceHandlers) :
            undefined;
    }

    get reviewRunner(): Maker<OnPendingScanStatus> {
        const reviewers = this.projectReviewers;
        const inspections = this.codeReactions;
        const autoEditors = this.autoEditors;
        return (reviewers.length + inspections.length + autoEditors.length > 0) ?
            () => new OnPendingScanStatus(this.scanContext, reviewers, inspections, autoEditors) :
            undefined;
    }

    public abstract phaseSetup: Maker<SetupPhasesOnPush>;

    public oldPushSuperseder: Maker<SetSupersededStatus> = SetSupersededStatus;

    get onSuperseded(): Maker<OnSupersededStatus> {
        return this.supersededListeners.length > 0 ?
            () => new OnSupersededStatus(...this.supersededListeners) :
            undefined;
    }

    public phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>> =
        this.possiblePhases.map(phases => () => new FailDownstreamPhasesOnPhaseFailure(phases));

    public abstract builder: Maker<StatusSuccessHandler>;

    public artifactFinder: Maker<HandleEvent<OnImageLinked.Subscription>>;

    public abstract deploy1: Maker<HandleEvent<OnSuccessStatus.Subscription> & EventWithCommand>;

    get notifyOnDeploy(): Maker<OnDeployStatus> {
        return this.deploymentListeners.length > 0 ?
            () => new OnDeployStatus(...this.deploymentListeners) :
            undefined;
    }

    get verifyEndpoint(): Maker<OnEndpointStatus> {
        return this.endpointVerificationListeners.length > 0 ?
            () => new OnEndpointStatus(...this.endpointVerificationListeners) :
            undefined;
    }

    get onVerifiedStatus(): Maker<OnVerifiedStatus> {
        return this.verifiedDeploymentListeners.length > 0 ?
            () => new OnVerifiedStatus(...this.verifiedDeploymentListeners) :
            undefined;
    }

    public abstract promotedEnvironment?: PromotedEnvironment;

    public onBuildComplete: Maker<SetStatusOnBuildComplete> =
        () => new SetStatusOnBuildComplete(BuildContext)

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return (this.phaseCleanup as Array<Maker<HandleEvent<any>>>)
            .concat(this.supportingEvents)
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
                this.deploy1,
                !!this.promotedEnvironment ? this.promotedEnvironment.deploy : undefined,
                this.notifyOnDeploy,
                this.verifyEndpoint,
                this.onVerifiedStatus,
                this.artifactFinder,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        const mayHaveCommand = toFactory(this.deploy1)();
        return this.generators
            .concat(this.editors)
            .concat(this.supportingCommands)
            .concat([mayHaveCommand.correspondingCommand ? () => mayHaveCommand.correspondingCommand() : undefined])
            .concat([
                !!this.promotedEnvironment ? this.promotedEnvironment.promote : undefined,
                !!this.promotedEnvironment ? this.promotedEnvironment.offerPromotionCommand : undefined,
            ]).filter(m => !!m);
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

    public addRepoCreationListeners(...nrc: RepoCreationListener[]): this {
        this.repoCreationListeners = this.repoCreationListeners.concat(nrc);
        return this;
    }

    public addNewRepoWithCodeActions(...nrc: ProjectListener[]): this {
        this.newRepoWithCodeActions = this.newRepoWithCodeActions.concat(nrc);
        return this;
    }

    public addProjectReviewers(...r: ProjectReviewer[]): this {
        this.projectReviewers = this.projectReviewers.concat(r);
        return this;
    }

    public addCodeReactions(...cr: ProjectListener[]): this {
        this.codeReactions = this.codeReactions.concat(cr);
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

    public addSupersededListeners(...l: Array<SdmListener<SupersededListenerInvocation>>): this {
        this.supersededListeners = this.supersededListeners.concat(l);
        return this;
    }

    public addFingerprintDifferenceHandlers(...fh: FingerprintDifferenceHandler[]): this {
        this.fingerprintDifferenceHandlers = this.fingerprintDifferenceHandlers.concat(fh);
        return this;
    }

    public addDeploymentListeners(...l: DeployListener[]): this {
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

    protected abstract scanContext: string;
}
