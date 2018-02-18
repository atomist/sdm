import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { createLinkableProgressLog } from "../../../handlers/events/delivery/log/NaiveLinkablePersistentProgressLog";
import { BuiltContext } from "../../../handlers/events/delivery/phases/core";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";

export const LocalMavenBuildOnSucessStatus = () =>
    new BuildOnScanSuccessStatus(
        HttpServicePhases,
        BuiltContext,
        new MavenBuilder(artifactStore, createLinkableProgressLog));
