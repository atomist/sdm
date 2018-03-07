import { logger } from "@atomist/automation-client";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { HasCloudFoundryManifest } from "../common/listener/support/cloudFoundryManifestPushTest";
import { whenPushSatisfies } from "../common/listener/support/GuardedPhaseCreator";
import { IsMaven, IsSpringBoot } from "../common/listener/support/jvmGuards";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import { PushFromAtomist, PushToDefaultBranch, PushToPublicRepo } from "../common/listener/support/pushTests";
import { not } from "../common/listener/support/pushTestUtils";
import {
    HttpServiceGoals,
    LocalDeploymentGoals,
    NoGoals,
} from "../handlers/events/delivery/goals/httpServiceGoals";
import { LibraryGoals } from "../handlers/events/delivery/goals/libraryGoals";
import { NpmGoals } from "../handlers/events/delivery/goals/npmGoals";
import { lookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { LocalBuildOnSuccessStatus } from "./blueprint/build/localBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnSuccessStatus } from "./blueprint/deploy/cloudFoundryDeploy";
import { LocalExecutableJarDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "./commands/editors/pcf/addCloudFoundryManifest";
import { configureSpringSdm } from "./springSdmConfig";

export function cloudFoundrySoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: LocalBuildOnSuccessStatus,
            // CloudFoundryStagingDeployOnSuccessStatus;
            deployers: [
                () => LocalExecutableJarDeployOnSuccessStatus,
                CloudFoundryProductionDeployOnSuccessStatus,
            ],
        },
        whenPushSatisfies(IsMaven, IsSpringBoot, not(MaterialChangeToJavaRepo))
            .usePhases(NoGoals),
        whenPushSatisfies(PushToDefaultBranch, IsMaven, IsSpringBoot, HasCloudFoundryManifest, PushToPublicRepo)
            .usePhases(HttpServiceGoals),
        whenPushSatisfies(IsMaven, IsSpringBoot, not(PushFromAtomist))
            .usePhases(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo)
            .usePhases(LibraryGoals),
        whenPushSatisfies(IsNode)
            .usePhases(NpmGoals),
    );
    sdm.addNewRepoWithCodeActions(suggestAddingCloudFoundryManifest)
        .addSupportingCommands(
            () => addCloudFoundryManifest,
        )
        .addEndpointVerificationListeners(lookFor200OnEndpointRootGet())
        .addSupersededListeners(
            inv => {
                logger.info("Will undeploy application %j", inv.id);
                return LocalExecutableJarDeployOnSuccessStatus.deployer.undeploy(inv.id);
            });
    configureSpringSdm(sdm, opts);
    return sdm;
}
