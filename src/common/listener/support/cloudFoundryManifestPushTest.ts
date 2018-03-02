
import { CloudFoundryManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { PushTest } from "../PhaseCreator";

export const HasCloudFoundryManifest: PushTest = async inv => {
    try {
        await inv.project.findFile(CloudFoundryManifestPath);
        return true;
    } catch {
        return false;
    }
};
