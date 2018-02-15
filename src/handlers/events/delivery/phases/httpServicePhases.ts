import {Phases, PlannedPhase} from "../Phases";

export const BaseContext = "sdm/atomist/";
export const IndependentOfEnvironment = "0-code/";
export const StagingEnvironment = "1-staging/";
export const ProductionEnvironment = "2-prod/";

export const ScanContext = BaseContext + IndependentOfEnvironment + "1-scan";
export const BuiltContext = BaseContext + IndependentOfEnvironment + "2-build";
export const StagingDeploymentContext = BaseContext + StagingEnvironment + "3-deploy";
export const StagingEndpointContext = BaseContext + StagingEnvironment + "4-endpoint";
export const StagingVerifiedContext = BaseContext + StagingEnvironment + "5-verifyEndpoint";

export const ContextToName: { [key: string]: PlannedPhase } = {};
ContextToName[ScanContext] = {context: ScanContext, name: "scan"};
ContextToName[BuiltContext] = {context: BuiltContext, name: "build"};
ContextToName[StagingDeploymentContext] = {context: StagingDeploymentContext, name: "deploy to staging"};
ContextToName[StagingEndpointContext] = {context: StagingEndpointContext, name: "find endpoint in staging"};
ContextToName[StagingVerifiedContext] = {context: StagingVerifiedContext, name: "verify endpoint in staging"};

/**
 * Phases for an Http service
 * @type {Phases}
 */
export const HttpServicePhases = new Phases([ScanContext, BuiltContext, StagingDeploymentContext, StagingEndpointContext, StagingVerifiedContext]);

export const LibraryPhases = new Phases([ScanContext, BuiltContext]);
