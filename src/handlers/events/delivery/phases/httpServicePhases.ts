
import { Phases } from "../Phases";

export const ScanContext = "1. code scan";
export const ArtifactContext = "2. create artifact";
export const StagingDeploymentContext = "3. deploy:staging";
export const StagingEndpointContext = "4. starting endpoint:staging";
export const StagingVerifiedContext = "5. verified:staging";

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([ScanContext, ArtifactContext, StagingDeploymentContext, StagingEndpointContext, StagingVerifiedContext]);

export const LibraryPhases = new Phases([ScanContext, ArtifactContext]);
