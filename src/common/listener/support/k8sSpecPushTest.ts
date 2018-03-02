import { AtomistK8sSpecFile } from "../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { PushTest } from "../PhaseCreator";

export const HasK8Spec: PushTest = async inv => {
    try {
        await inv.project.findFile(AtomistK8sSpecFile);
        return true;
    } catch {
        return false;
    }
};
