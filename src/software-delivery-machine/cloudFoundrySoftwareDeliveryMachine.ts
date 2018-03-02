import { logger } from "@atomist/automation-client";
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
import { CloudFoundryProductionDeployOnSuccessStatus } from "./blueprint/deploy/cloudFoundryDeploy";
import { LocalSpringBootMavenDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "./commands/editors/pcf/addCloudFoundryManifest";
import { configureSpringSdm } from "./springSdmConfig";

const LocalExecutableJarDeployer = LocalSpringBootMavenDeployOnSuccessStatus;

export function cloudFoundrySoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: LocalBuildOnSuccessStatus,
            // CloudFoundryStagingDeployOnSuccessStatus;
            deployers: [
                () => LocalExecutableJarDeployer,
                CloudFoundryProductionDeployOnSuccessStatus,
            ],
        },
        new GuardedPhaseCreator(HttpServicePhases, PushesToDefaultBranch, HasCloudFoundryManifest, PushToPublicRepo, MaterialChangeToJavaRepo),
        new GuardedPhaseCreator(npmPhases, IsNode),
        new GuardedPhaseCreator(LibraryPhases, MaterialChangeToJavaRepo));
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
