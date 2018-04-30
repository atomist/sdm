import { LogFactory } from "..";
import { ProjectLoader } from "../common/repo/ProjectLoader";
import { ArtifactStore } from "../spi/artifact/ArtifactStore";

/**
 * Infrastructure options for a SoftwareDeliveryMachine
 */
export interface SoftwareDeliveryMachineOptions {

    artifactStore: ArtifactStore;
    projectLoader: ProjectLoader;
    logFactory: LogFactory;
}
