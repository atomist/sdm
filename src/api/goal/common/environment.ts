
export type GoalEnvironment = "0-code/" | "1-staging/" | "2-prod/" | "8-doom/";

export const IndependentOfEnvironment: GoalEnvironment = "0-code/";

export const StagingEnvironment: GoalEnvironment = "1-staging/";
// should always be number dash name. The number may be a decimal
export const ProductionEnvironment: GoalEnvironment = "2-prod/";
export const ProjectDisposalEnvironment: GoalEnvironment = "8-doom/";
