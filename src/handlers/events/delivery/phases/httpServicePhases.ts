
import { ArtifactContext, StagingDeploymentContext, StagingEndpointContext, Phases, ScanContext, StagingVerifiedContext } from "../Phases";

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([ScanContext, ArtifactContext, StagingDeploymentContext, StagingEndpointContext, StagingVerifiedContext]);
