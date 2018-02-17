import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { createLinkableProgressLog } from "../../../handlers/events/delivery/log/NaiveLinkablePersistentProgressLog";
import { artifactStore } from "../artifactStore";

export const LocalMavenBuildOnSucessStatus = () =>
    new BuildOnScanSuccessStatus(new MavenBuilder(artifactStore, createLinkableProgressLog));
