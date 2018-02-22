import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { createLinkableProgressLog } from "../../../handlers/events/delivery/log/NaiveLinkablePersistentProgressLog";
import { BuildContext } from "../../../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";
import { K8sAutomationBuilder } from "../../../handlers/events/delivery/build/k8s/K8AutomationBuilder";

export const K8sBuildOnSuccessStatus = () =>
    new BuildOnScanSuccessStatus(
        HttpServicePhases,
        BuildContext,
        new K8sAutomationBuilder());
