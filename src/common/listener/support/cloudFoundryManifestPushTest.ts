
import { CloudFoundryManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { PushTest } from "../GoalSetter";

import { fileExists } from "@atomist/automation-client/project/util/projectUtils";

export const HasCloudFoundryManifest: PushTest = async inv =>
    fileExists(inv.project, CloudFoundryManifestPath, f => true);
