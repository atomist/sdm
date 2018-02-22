import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { createLinkableProgressLog } from "../../../handlers/events/delivery/log/NaiveLinkablePersistentProgressLog";
import { BuildContext } from "../../../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";

export const LocalMavenBuildOnSuccessStatus = () =>
    new BuildOnScanSuccessStatus(
        HttpServicePhases,
        BuildContext,
        new MavenBuilder(artifactStore, createLinkableProgressLog));
