import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { BuiltContext } from "../handlers/events/delivery/phases/core";
import {
    CodeInspection,
    ReviewOnPendingScanStatus,
} from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { ActOnRepoCreation } from "../handlers/events/repo/ActOnRepoCreation";
import { Fingerprinter, FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { NewRepoWithCodeAction, OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import {
    FingerprintDifferenceHandler,
    ReactToSemanticDiffsOnPushImpact,
} from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OnImageLinked, OnSuccessStatus } from "../typings/types";
import { PromotedEnvironment } from "./DeliveryBlueprint";
import { NewRepoReactor } from "./NewRepoReactor";
import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Superclass for user software delivery machines
 */
export abstract class AbstractSoftwareDeliveryMachine implements SoftwareDeliveryMachine {

    /**
     * All possible phases we can set up. Makes cleanup easier.
     */
    protected abstract possiblePhases: Phases[];

    public onRepoCreation?: Maker<ActOnRepoCreation>;

    public get onNewRepoWithCode(): Maker<OnFirstPushToRepo> {
        return () => new OnFirstPushToRepo(this.newRepoWithCodeActions);
    }

    public get fingerprinter(): Maker<FingerprintOnPush> {
        return !!this.fingerprinters ?
            () => new FingerprintOnPush(this.fingerprinters) :
            undefined;
    }

    public get semanticDiffReactor(): Maker<ReactToSemanticDiffsOnPushImpact> {
        return !!this.fingerprintDifferenceHandlers ?
            () => new ReactToSemanticDiffsOnPushImpact(this.fingerprintDifferenceHandlers) :
            undefined;
    }

    get reviewRunner(): Maker<ReviewOnPendingScanStatus> {
        const reviewers = this.projectReviewers;
        const inspections = this.codeInspections;
        return (!!reviewers && !!inspections) ?
            () => new ReviewOnPendingScanStatus(reviewers, inspections) :
            undefined;
    }

    public abstract phaseSetup: Maker<SetupPhasesOnPush>;

    public phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>> =
        this.possiblePhases.map(phases => () => new FailDownstreamPhasesOnPhaseFailure(phases));

    // TODO can have more of these?
    public abstract builder: Maker<HandleEvent<OnSuccessStatus.Subscription>>;

    public abstract deploy1: Maker<HandleEvent<OnImageLinked.Subscription>>;

    public abstract notifyOnDeploy?: Maker<OnDeployStatus>;

    public abstract verifyEndpoint?: Maker<VerifyOnEndpointStatus>;

    public abstract onVerifiedStatus?: Maker<OnVerifiedStatus>;

    public abstract promotedEnvironment?: PromotedEnvironment;

    public onBuildComplete: Maker<SetStatusOnBuildComplete> =
        () => new SetStatusOnBuildComplete(BuiltContext)

    public abstract generators: Array<Maker<HandleCommand>>;

    public abstract editors: Array<Maker<HandleCommand>>;

    /**
     * Miscellaneous supporting commands
     */
    public abstract supportingCommands: Array<Maker<HandleCommand>>;

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return (this.phaseCleanup as Array<Maker<HandleEvent<any>>>)
            .concat([
                this.onRepoCreation,
                this.onNewRepoWithCode,
                this.fingerprinter,
                this.semanticDiffReactor,
                this.reviewRunner,
                this.phaseSetup,
                this.builder,
                this.onBuildComplete,
                this.deploy1,
                !!this.promotedEnvironment ? this.promotedEnvironment.deploy : undefined,
                this.notifyOnDeploy,
                this.verifyEndpoint,
                this.onVerifiedStatus,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.generators
            .concat(this.supportingCommands)
            .concat([
                !!this.promotedEnvironment ? this.promotedEnvironment.promote : undefined,
                !!this.promotedEnvironment ? this.promotedEnvironment.offerPromotionCommand : undefined,
            ]).filter(m => !!m);
    }

    protected newRepoWithCodeActions?: NewRepoWithCodeAction[];

    protected projectReviewers?: ProjectReviewer[];

    protected codeInspections?: CodeInspection[];

    protected fingerprinters?: Fingerprinter[];

    protected fingerprintDifferenceHandlers?: FingerprintDifferenceHandler[];

}
