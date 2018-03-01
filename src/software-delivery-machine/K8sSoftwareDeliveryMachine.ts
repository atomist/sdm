import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion } from "./blueprint/deploy/k8sDeploy";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { configureSpringSdm } from "./cloudFoundrySoftwareDeliveryMachine";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function K8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        K8sBuildOnSuccessStatus,
        K8sStagingDeployOnSuccessStatus);
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addSupportingEvents(() => NoticeK8sDeployCompletion);
    configureSpringSdm(sdm, opts);
    return sdm;
}
