import { ScanContext } from "../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { BuildableSoftwareDeliveryMachine } from "../sdm-support/BuildableSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm-support/ReferenceDeliveryBlueprint";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { K8sStagingDeployOnSuccessStatus } from "./blueprint/deploy/k8sDeploy";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { configureSpringSdm } from "./springPCFSoftwareDeliveryMachine";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

// CloudFoundryStagingDeployOnImageLinked

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function springK8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): BuildableSoftwareDeliveryMachine {
    const sdm = new BuildableSoftwareDeliveryMachine([HttpServicePhases, LibraryPhases],
        ScanContext,
        K8sBuildOnSuccessStatus,
        K8sStagingDeployOnSuccessStatus);
    sdm.addPromotedEnvironment(promotedEnvironment);
    configureSpringSdm(sdm, opts);
    return sdm;
}
