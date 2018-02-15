
import { Phases } from "../Phases";
import {BaseContext, ContextToPlannedPhase, ProductionEnvironment} from "./httpServicePhases";

// TODO get rid of hard coding of number

export const ProductionDeploymentContext = BaseContext + ProductionEnvironment + "3-deploy";
export const ProductionEndpointContext = BaseContext + ProductionEnvironment + "4-endpoint";
export const ProductionVerifiedContext = BaseContext + ProductionEnvironment + "5-verifyEndpoint";

export const ProductionDeploymentPhase = { context: ProductionDeploymentContext, name: "deploy to production" };
export const ProductionEndpointPhase =  { context: ProductionEndpointContext, name: "find production endpoint" };
export const ProductionVerifiedPhase =  { context: ProductionVerifiedContext, name: "verify production endpoint" };

/**
 * Phases for deploying an artifact to production
 * @type {Phases}
 */
export const ProductionDeployPhases = new Phases([ProductionDeploymentContext, ProductionEndpointContext]); //, ProductionVerifiedContext]);
