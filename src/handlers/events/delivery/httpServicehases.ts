
import { ArtifactContext, DeploymentContext, EndpointContext, Phases, ScanContext, VerifiedContext } from "./Phases";

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([ScanContext, ArtifactContext, DeploymentContext, EndpointContext, VerifiedContext]);
