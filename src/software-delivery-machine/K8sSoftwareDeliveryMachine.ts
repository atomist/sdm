import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { ScanContext } from "../common/phases/gitHubContext";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import {K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion} from "./blueprint/deploy/k8sDeploy";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { configureSpringSdm } from "./cloudFoundrySoftwareDeliveryMachine";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

// CloudFoundryStagingDeployOnImageLinked

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function K8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine([HttpServicePhases, LibraryPhases],
        K8sBuildOnSuccessStatus,
        K8sStagingDeployOnSuccessStatus);
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addSupportingEvents(() => NoticeK8sDeployCompletion);
    configureSpringSdm(sdm, opts);
    return sdm;
}
