import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { BuiltContext } from "../handlers/events/delivery/phases/core";
import { ReviewOnPendingScanStatus } from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { ActOnRepoCreation } from "../handlers/events/repo/ActOnRepoCreation";
import { FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OfferPromotionParameters } from "../software-delivery-machine/blueprint/deploy/offerPromotion";
import { OnDeployToProductionFingerprint, OnImageLinked, OnSuccessStatus } from "../typings/types";
import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Superclass for user software delivery machines
 */
export abstract class AbstractSoftwareDeliveryMachine implements SoftwareDeliveryMachine {

    protected abstract possiblePhases: Phases[];

    public abstract onRepoCreation?: Maker<ActOnRepoCreation>;

    public abstract onNewRepoWithCode: Maker<OnFirstPushToRepo>;

    public abstract fingerprinter?: Maker<FingerprintOnPush>;

    public abstract semanticDiffReactor?: Maker<ReactToSemanticDiffsOnPushImpact>;

    public abstract reviewRunner?: Maker<ReviewOnPendingScanStatus>;

    public abstract phaseSetup: Maker<SetupPhasesOnPush>;

    public phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>> =
        this.possiblePhases.map(phases => () => new FailDownstreamPhasesOnPhaseFailure(phases));

    // TODO can have more of these?
    public abstract builder: Maker<HandleEvent<OnSuccessStatus.Subscription>>;

    public abstract deploy1: Maker<HandleEvent<OnImageLinked.Subscription>>;

    public abstract notifyOnDeploy?: Maker<OnDeployStatus>;

    public abstract verifyEndpoint?: Maker<VerifyOnEndpointStatus>;

    public abstract onVerifiedStatus?: Maker<OnVerifiedStatus>;

    public abstract deploy2: Maker<HandleEvent<OnDeployToProductionFingerprint.Subscription>>;

    public abstract deployToProduction?: Maker<HandleCommand>;

    public abstract offerPromotionCommand?: Maker<HandleCommand<OfferPromotionParameters>>;

    public onBuildComplete: Maker<SetStatusOnBuildComplete> =
        () => new SetStatusOnBuildComplete(BuiltContext)

    public abstract generators: Array<Maker<HandleCommand>>;

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
                this.deploy2,
                this.notifyOnDeploy,
                this.verifyEndpoint,
                this.onVerifiedStatus,
            ]).filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.generators
            .concat(this.supportingCommands)
            .concat([
                this.deployToProduction,
                this.offerPromotionCommand,
            ]).filter(m => !!m);
    }

}
