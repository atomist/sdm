import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { GuardedPhaseCreator } from "../common/listener/support/GuardedPhaseCreator";
import { HasK8Spec } from "../common/listener/support/k8sSpecPushTest";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import { PushesToDefaultBranch, PushToPublicRepo } from "../common/listener/support/pushTests";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { npmPhases } from "../handlers/events/delivery/phases/npmPhases";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion } from "./blueprint/deploy/k8sDeploy";
import { offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { suggestAddingK8sSpec } from "./blueprint/repo/suggestAddingK8sSpec";
import { addK8sSpec } from "./commands/editors/k8s/addK8sSpec";
import { configureSpringSdm } from "./springSdmConfig";

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
            deployers: [ K8sStagingDeployOnSuccessStatus ],
        },
        new GuardedPhaseCreator(HttpServicePhases, HasK8Spec, PushesToDefaultBranch, PushToPublicRepo, MaterialChangeToJavaRepo),
        new GuardedPhaseCreator(npmPhases, IsNode),
        new GuardedPhaseCreator(LibraryPhases, MaterialChangeToJavaRepo));
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addNewRepoWithCodeActions(suggestAddingK8sSpec);
    sdm.addSupportingCommands(
        () => addK8sSpec,
    );
    sdm.addSupportingEvents(() => NoticeK8sDeployCompletion);
    configureSpringSdm(sdm, opts);
    return sdm;
}
