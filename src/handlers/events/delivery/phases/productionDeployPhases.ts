
import { Phases } from "../Phases";
import {BaseContext, ContextToName, StagingEnvironment} from "./httpServicePhases";

// TODO get rid of hard coding of number

export const ProductionDeploymentContext = BaseContext + StagingEnvironment + "3-deploy";
export const ProductionEndpointContext = BaseContext + StagingEnvironment + "4-endpoint";
export const ProductionVerifiedContext = BaseContext + StagingEnvironment + "5-verifyEndpoint";

ContextToName[ProductionDeploymentContext] = { context: ProductionDeploymentContext, name: "deploy to production" };
ContextToName[ProductionEndpointContext] = { context: ProductionEndpointContext, name: "find production endpoint" };
ContextToName[ProductionVerifiedContext] = { context: ProductionVerifiedContext, name: "verify production endpoint" };

/**
 * Phases for deploying an artifact to production
 * @type {Phases}
 */
export const ProductionDeployPhases = new Phases([ProductionDeploymentContext, ProductionEndpointContext]); //, ProductionVerifiedContext]);
