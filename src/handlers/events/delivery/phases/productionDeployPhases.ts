
import { Phases } from "../Phases";

// TODO get rid of hard coding of name
export const ProductionDeploymentContext = "6. deploy:production";
export const ProductionEndpointContext = "7. starting endpoint:production";
export const ProductionVerifiedContext = "8. verified:production";

/**
 * Phases for deploying an artifact to production
 * @type {Phases}
 */
export const ProductionDeployPhases = new Phases([ProductionDeploymentContext]);//, ProductionEndpointContext, ProductionVerifiedContext]);
