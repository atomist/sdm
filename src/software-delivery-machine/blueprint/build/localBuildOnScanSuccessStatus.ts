import { createEphemeralProgressLog } from "../../../common/log/EphemeralProgressLog";
import { BuildOnScanSuccessStatus } from "../../../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { MavenBuilder } from "../../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { NpmBuilder } from "../../../handlers/events/delivery/build/local/npm/NpmBuilder";
import { BuildContext, HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";

export const LocalBuildOnSuccessStatus = () =>
    new BuildOnScanSuccessStatus(
        HttpServicePhases,
        BuildContext,
        // TODO use async method in client so this isn't sync
        {builder: new MavenBuilder(artifactStore, createEphemeralProgressLog), test: async li => li.project.fileExistsSync("pom.xml")},
        {builder: new NpmBuilder(artifactStore, createEphemeralProgressLog), test: async li => li.project.fileExistsSync("package.json")},
    );
