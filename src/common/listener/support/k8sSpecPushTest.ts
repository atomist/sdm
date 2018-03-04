import { AtomistK8sSpecFile } from "../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { PhaseCreationInvocation, PushTest } from "../PhaseCreator";

export const HasK8Spec: PushTest = (pi: PhaseCreationInvocation) =>
    pi.project.findFile(AtomistK8sSpecFile)
        .then(() => true, () => false);
