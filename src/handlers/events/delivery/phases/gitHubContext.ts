import {GitHubStatusContext} from "../Phases";

export const BaseContext = "sdm/atomist/";
export const IndependentOfEnvironment = "0-code/";
export const StagingEnvironment = "1-staging/";
// should always be number dash name. The number may be a decimal
export const ProductionEnvironment = "2-prod/";

export const ScanContext = BaseContext + IndependentOfEnvironment + "1-scan";
export const BuiltContext = BaseContext + IndependentOfEnvironment + "2-build";

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

        const phasePart = matchWhole[2];
        const env = matchWhole[1];
        const matchPhase = phasePart.match(numberAndName);
        if (!matchPhase) {
            return;
        }
        const name = matchPhase[2];
        const order = +matchPhase[1];

        return {base: BaseContext, env, name, order};
    }
}

/*
 * true if contextB is in the same series of phases as A,
 * and A comes before B
 */
export function contextIsAfter(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    if (belongToSameSeriesOfPhases(contextA, contextB)) {
        const splitA = splitContext(contextA);
        const splitB = splitContext(contextB);
        return
    }
}

function belongToSameSeriesOfPhases(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    const splitA = splitContext(contextA);
    const splitB = splitContext(contextB);
    return splitA && splitB && splitA.env === splitB.env && splitA.base === splitB.base;
}