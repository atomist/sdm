import { logger } from "@atomist/automation-client";
import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { CloudFoundryManifestPushTest } from "../common/listener/support/cloudFoundryManifestPushTest";
import { PushesToDefaultBranch, PushesToMaster, PushToPublicRepo } from "../common/listener/support/pushTests";
import { LocalBuildOnSuccessStatus } from "./blueprint/build/localBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { JavaLibraryPhaseCreator, SpringBootDeployPhaseCreator } from "./blueprint/phase/jvmPhaseManagement";
import { NodePhaseCreator } from "./blueprint/phase/nodePhaseManagement";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "./commands/editors/pcf/addCloudFoundryManifest";
import { configureSpringSdm } from "./springSdmConfig";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

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
            deploy1: () => LocalMavenDeployer,
        },
        new SpringBootDeployPhaseCreator(PushesToDefaultBranch, CloudFoundryManifestPushTest, PushToPublicRepo),
        new NodePhaseCreator(),
        new JavaLibraryPhaseCreator());
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addNewRepoWithCodeActions(suggestAddingCloudFoundryManifest);
    sdm.addSupportingCommands(
        () => addCloudFoundryManifest,
    )
        .addSupersededListeners(
            inv => {
                logger.info("Will undeploy application %j", inv.id);
                return LocalMavenDeployer.deployer.undeploy(inv.id);
            });
    configureSpringSdm(sdm, opts);
    return sdm;
}
