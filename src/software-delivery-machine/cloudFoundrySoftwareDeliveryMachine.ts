import { logger } from "@atomist/automation-client";
import { onAnyPush, whenPushSatisfies } from "../blueprint/ruleDsl";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { HasCloudFoundryManifest } from "../common/listener/support/cloudFoundryManifestPushTest";
import { IsMaven, IsSpringBoot } from "../common/listener/support/jvmGuards";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import { PushFromAtomist, PushToDefaultBranch, PushToPublicRepo } from "../common/listener/support/pushTests";
import { not } from "../common/listener/support/pushTestUtils";
import { createEphemeralProgressLog } from "../common/log/EphemeralProgressLog";
import { MavenBuilder } from "../handlers/events/delivery/build/local/maven/MavenBuilder";
import { NpmBuilder } from "../handlers/events/delivery/build/local/npm/NpmBuilder";
import {
    HttpServiceGoals,
    LocalDeploymentGoals,
    NoGoals,
} from "../handlers/events/delivery/goals/httpServiceGoals";
import { LibraryGoals } from "../handlers/events/delivery/goals/libraryGoals";
import { NpmGoals } from "../handlers/events/delivery/goals/npmGoals";
import { lookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { artifactStore } from "./blueprint/artifactStore";
import { CloudFoundryProductionDeployOnSuccessStatus } from "./blueprint/deploy/cloudFoundryDeploy";
import { LocalExecutableJarDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "./commands/editors/pcf/addCloudFoundryManifest";
import { configureSpringSdm } from "./springSdmConfig";

// TODO take a deployer?

export function cloudFoundrySoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            deployers: [
                () => LocalExecutableJarDeployOnSuccessStatus,
                CloudFoundryProductionDeployOnSuccessStatus,
            ],
            artifactStore,
        },
        whenPushSatisfies(IsMaven, IsSpringBoot, not(MaterialChangeToJavaRepo))
            .setGoals(NoGoals),
        whenPushSatisfies(PushToDefaultBranch, IsMaven, IsSpringBoot, HasCloudFoundryManifest, PushToPublicRepo)
            .setGoals(HttpServiceGoals),
        whenPushSatisfies(IsMaven, IsSpringBoot, not(PushFromAtomist))
            .setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo)
            .setGoals(LibraryGoals),
        whenPushSatisfies(IsNode)
            .setGoals(NpmGoals)
            .buildWith(new NpmBuilder(artifactStore, createEphemeralProgressLog)),
        onAnyPush().buildWith(new MavenBuilder(artifactStore, createEphemeralProgressLog)),
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
