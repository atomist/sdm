
import { Phases } from "../Phases";

export const ProductionDeploymentContext = "1. deploy:production";
export const ProductionEndpointContext = "4. starting endpoint:production";
export const ProductionVerifiedContext = "5. verified:production";

/**
 * Phases for deploying an artifact to production
 * @type {Phases}
 */
export const ProductionDeployPhases = new Phases([ProductionDeploymentContext]);//, ProductionEndpointContext, ProductionVerifiedContext]);
