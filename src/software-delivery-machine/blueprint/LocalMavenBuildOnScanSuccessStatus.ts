import { MavenBuilder } from "../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { BuildOnScanSuccessStatus } from "../../handlers/events/delivery/BuildOnScanSuccessStatus";
import { artifactStore } from "./artifactStore";
import { createLinkableProgressLog } from "../../handlers/events/delivery/log/NaiveLinkablePersistentProgressLog";

export const LocalMavenBuildOnSucessStatus = () =>
    new BuildOnScanSuccessStatus(new MavenBuilder(artifactStore, createLinkableProgressLog));
