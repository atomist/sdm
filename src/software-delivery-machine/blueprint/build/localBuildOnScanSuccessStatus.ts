import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { NpmBuilder } from "../../../handlers/events/delivery/build/local/npm/NpmBuilder";
import { BuildContext } from "../../../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { createLinkableProgressLog } from "../../../spi/log/NaiveLinkablePersistentProgressLog";
import { artifactStore } from "../artifactStore";

export const LocalBuildOnSuccessStatus = () =>
    new BuildOnScanSuccessStatus(
        HttpServicePhases,
        BuildContext,
        // TODO add async method in client so this isn't sync
        {builder: new MavenBuilder(artifactStore, createLinkableProgressLog), test: async li => li.project.fileExistsSync("pom.xml")},
        {builder: new NpmBuilder(artifactStore, createLinkableProgressLog), test: async li => li.project.fileExistsSync("package.json")},
    );
