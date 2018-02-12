
import { MavenBuilder } from "../../handlers/events/delivery/build/local/maven/MavenBuilder";
import { BuildOnScanSuccessStatus } from "../../handlers/events/delivery/BuildOnScanSuccessStatus";

export const LocalMavenBuildOnSucessStatus =
    new BuildOnScanSuccessStatus(new MavenBuilder());
