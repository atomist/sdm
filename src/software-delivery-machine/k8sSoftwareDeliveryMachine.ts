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
import {
    K8sProductionDeployOnSuccessStatus, K8sStagingDeployOnSuccessStatus,
    NoticeK8sDeployCompletion,
} from "./blueprint/deploy/k8sDeploy";
import { suggestAddingK8sSpec } from "./blueprint/repo/suggestAddingK8sSpec";
import { addK8sSpec } from "./commands/editors/k8s/addK8sSpec";
import { configureSpringSdm } from "./springSdmConfig";

export function k8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: K8sBuildOnSuccessStatus,
            deployers: [
                K8sStagingDeployOnSuccessStatus,
                K8sProductionDeployOnSuccessStatus,
            ],
        },
        new GuardedPhaseCreator(HttpServicePhases, HasK8Spec, PushesToDefaultBranch, PushToPublicRepo, MaterialChangeToJavaRepo),
        new GuardedPhaseCreator(npmPhases, IsNode),
        new GuardedPhaseCreator(LibraryPhases, MaterialChangeToJavaRepo));
    sdm.addNewRepoWithCodeActions(suggestAddingK8sSpec);
    sdm.addSupportingCommands(
        () => addK8sSpec,
    );
    sdm.addSupportingEvents(() => NoticeK8sDeployCompletion);
    configureSpringSdm(sdm, opts);
    return sdm;
}
