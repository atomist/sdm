import { logger } from "@atomist/automation-client";
import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { HasCloudFoundryManifest } from "../common/listener/support/cloudFoundryManifestPushTest";
import { GuardedPhaseCreator } from "../common/listener/support/GuardedPhaseCreator";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import { PushesToDefaultBranch, PushToPublicRepo } from "../common/listener/support/pushTests";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { npmPhases } from "../handlers/events/delivery/phases/npmPhases";
import { LocalBuildOnSuccessStatus } from "./blueprint/build/localBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import {
    LocalExecutableJarDeployOnSuccessStatus,
    LocalSpringBootMavenDeployOnSuccessStatus
} from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "./commands/editors/pcf/addCloudFoundryManifest";
import { configureSpringSdm } from "./springSdmConfig";

const LocalExecutableJarDeployer = LocalSpringBootMavenDeployOnSuccessStatus;

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function cloudFoundrySoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: LocalBuildOnSuccessStatus,
            // CloudFoundryStagingDeployOnSuccessStatus;
            deployers: [
                () => LocalExecutableJarDeployer
            ],
        },
        new GuardedPhaseCreator(HttpServicePhases, PushesToDefaultBranch, HasCloudFoundryManifest, PushToPublicRepo, MaterialChangeToJavaRepo),
        new GuardedPhaseCreator(npmPhases, IsNode),
        new GuardedPhaseCreator(LibraryPhases, MaterialChangeToJavaRepo));
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addNewRepoWithCodeActions(suggestAddingCloudFoundryManifest);
    sdm.addSupportingCommands(
        () => addCloudFoundryManifest,
    )
        .addSupersededListeners(
            inv => {
                logger.info("Will undeploy application %j", inv.id);
                return LocalExecutableJarDeployer.deployer.undeploy(inv.id);
            });
    configureSpringSdm(sdm, opts);
    return sdm;
}
