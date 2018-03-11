import { onAnyPush, whenPushSatisfies } from "../blueprint/ruleDsl";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { IsMaven, IsSpringBoot } from "../common/listener/support/jvmGuards";
import { HasK8Spec } from "../common/listener/support/k8sSpecPushTest";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import { PushFromAtomist, ToDefaultBranch, ToPublicRepo } from "../common/listener/support/pushTests";
import { not } from "../common/listener/support/pushTestUtils";
import { K8sAutomationBuilder } from "../handlers/events/delivery/build/k8s/K8AutomationBuilder";
import { HttpServiceGoals, LocalDeploymentGoals } from "../handlers/events/delivery/goals/httpServiceGoals";
import { LibraryGoals } from "../handlers/events/delivery/goals/libraryGoals";
import { NpmGoals } from "../handlers/events/delivery/goals/npmGoals";
import { lookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { artifactStore } from "./blueprint/artifactStore";
import {
    K8sProductionDeployOnSuccessStatus,
    K8sStagingDeployOnSuccessStatus,
    NoticeK8sProdDeployCompletion,
    NoticeK8sTestDeployCompletion,
} from "./blueprint/deploy/k8sDeploy";
import { suggestAddingK8sSpec } from "./blueprint/repo/suggestAddingK8sSpec";
import { addK8sSpec } from "./commands/editors/k8s/addK8sSpec";
import { configureSpringSdm } from "./springSdmConfig";

export function k8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            deployers: [
                K8sStagingDeployOnSuccessStatus,
                K8sProductionDeployOnSuccessStatus,
            ],
            artifactStore,
        },
        whenPushSatisfies(ToDefaultBranch, IsMaven, IsSpringBoot,
            HasK8Spec,
            ToPublicRepo).setGoals(HttpServiceGoals),
        whenPushSatisfies(not(PushFromAtomist), IsMaven, IsSpringBoot).setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo).setGoals(LibraryGoals),
        whenPushSatisfies(IsNode).setGoals(NpmGoals),
        onAnyPush.buildWith(new K8sAutomationBuilder()),
    );
    sdm.addNewRepoWithCodeActions(suggestAddingK8sSpec)
        .addSupportingCommands(() => addK8sSpec)
        .addSupportingEvents(() => NoticeK8sTestDeployCompletion,
            () => NoticeK8sProdDeployCompletion)
        .addEndpointVerificationListeners(
            lookFor200OnEndpointRootGet({
                retries: 15,
                maxTimeout: 5000,
                minTimeout: 3000,
            }),
        );
    configureSpringSdm(sdm, opts);
    return sdm;
}
