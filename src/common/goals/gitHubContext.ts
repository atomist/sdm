import { logger } from "@atomist/automation-client";

// convention: "sdm/atomist/#-env/#-goal" (the numbers are for ordering)
export type GitHubStatusContext = string;

export type GoalEnvironment = "0-code/" | "1-staging/" | "2-prod/";

export const BaseContext = "sdm/atomist/";
export const IndependentOfEnvironment: GoalEnvironment = "0-code/";
export const StagingEnvironment: GoalEnvironment = "1-staging/";
// should always be number dash name. The number may be a decimal
export const ProductionEnvironment: GoalEnvironment = "2-prod/";

/**
 * if this is a context we created, then we can interpret it.
 * Otherwise returns undefined
 * @param {string} context
 * @returns {{base: string; env: string; stage: string}}
 */
export function splitContext(context: GitHubStatusContext) {
    if (context.startsWith(BaseContext)) {
        const numberAndName = /([0-9\.]+)-(.*)/;
        const wholeContext = /^sdm\/atomist\/(.*)\/(.*)$/;

        const matchWhole = context.match(wholeContext);
        if (!matchWhole) {
            return;
        }

        const goalPart = matchWhole[2];
        const matchEnv = matchWhole[1].match(numberAndName);
        const matchGoal = goalPart.match(numberAndName);
        if (!matchGoal || !matchEnv) {
            logger.debug(`Did not find number and name in ${matchWhole[1]} or ${matchWhole[2]}`);
            return;
        }
        const name = matchGoal[2];
        const goalOrder = +matchGoal[1];

        return {
            base: BaseContext, env: matchEnv[2], envOrder: +matchEnv[1], name,
            goalOrder,
            envPart: matchWhole[1],
            goalPart,
        };
    }
}

/*
 * true if contextB is in the same series of goals as A,
 * and A comes before B
 */
export function contextIsAfter(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    if (belongToSameSeriesOfGoals(contextA, contextB)) {
        const splitA = splitContext(contextA);
        const splitB = splitContext(contextB);
        return splitA.envOrder < splitB.envOrder || splitA.goalOrder < splitB.goalOrder;
    }
}

function belongToSameSeriesOfGoals(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    const splitA = splitContext(contextA);
    const splitB = splitContext(contextB);
    return splitA && splitB && splitA.base === splitB.base;
}
