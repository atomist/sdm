import { logger } from "@atomist/automation-client";
import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion } from "./blueprint/deploy/k8sDeploy";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { JavaLibraryPhaseCreator, SpringBootDeployPhaseCreator } from "./blueprint/phase/jvmPhaseManagement";
import { NodePhaseCreator } from "./blueprint/phase/nodePhaseManagement";
import { configureSpringSdm } from "./springSdmConfig";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function K8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: K8sBuildOnSuccessStatus,
            deploy1: K8sStagingDeployOnSuccessStatus,
        },
        new SpringBootDeployPhaseCreator(),
        new NodePhaseCreator(),
        new JavaLibraryPhaseCreator());
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addSupportingEvents(() => NoticeK8sDeployCompletion);
    sdm.addSupersededListeners(
        inv => {
            logger.info("Will undeploy application %j", inv.id);
            return LocalMavenDeployer.deployer.undeploy(inv.id);
        });
    configureSpringSdm(sdm, opts);
    return sdm;
}
