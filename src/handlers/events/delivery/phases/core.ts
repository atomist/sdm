
export const BaseContext = "sdm/atomist/";
export const IndependentOfEnvironment = "0-code/";
export const StagingEnvironment = "1-staging/";
export const ProductionEnvironment = "2-prod/";

export const ScanContext = BaseContext + IndependentOfEnvironment + "1-scan";
export const BuiltContext = BaseContext + IndependentOfEnvironment + "2-build";
