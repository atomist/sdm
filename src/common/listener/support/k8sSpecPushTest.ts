import { PushTest } from "../PhaseCreator";

export const K8sSpecTestPushTest: PushTest = async inv => {
    try {
        await inv.project.findFile("k8.json");
        return true;
    } catch {
        return false;
    }
};
