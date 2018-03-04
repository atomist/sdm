import { AtomistK8sSpecFile } from "../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { PushTest } from "../PhaseCreator";

export const HasK8Spec: PushTest = inv =>
    inv.project.findFile(AtomistK8sSpecFile)
        .then(() => true, () => false);
