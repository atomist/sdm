import { logger } from "@atomist/automation-client";
import * as _ from "lodash";
import { SdmContext } from "../../common/context/SdmContext";
import { Goal } from "../../common/delivery/goals/Goal";
import { Goals } from "../../common/delivery/goals/Goals";
import { Mapping, NeverMatch } from "../../common/listener/Mapping";
import { PushListenerInvocation } from "../../common/listener/PushListener";
import { GoalComponent, toGoals } from "./GoalComponent";

export type GoalContribution<F> = Mapping<F, GoalComponent>;

/**
 * An additive goal setter assembles the goals contributed by all the contributors.
 */
class AdditiveGoalSetter<F extends SdmContext> implements Mapping<F, Goals> {

    private readonly contributors: Array<Mapping<F, Goal[]>> = [];

    constructor(public name: string, contributors: Array<GoalContribution<F>>) {
        this.contributors = contributors.map(c => ({
            name: c.name,
            async mapping(p) {
                const r = await c.mapping(p);
                if (!r) {
                    return r as any;
                }
                return toGoals(r).goals;
            },
        }));
    }

    public async mapping(p: F): Promise<NeverMatch | Goals | undefined> {
        const contributorGoals: Goal[][] = await Promise.all(
            this.contributors.map(c => c.mapping(p)),
        );
        const uniqueGoals: Goal[] = _.uniq(_.flatten(contributorGoals.filter(x => !!x)));
        logger.info("Unique goal names=[%s]: correlationId=%s", uniqueGoals.map(g => g.name), p.context.correlationId);
        return uniqueGoals.length === 0 ?
            undefined :
            new Goals(this.name, ...uniqueGoals);
    }

}

/**
 * Contribute goals based on a series of contribution rules.
 * Duplicates will be removed.
 * @param contributor first contributor
 * @param {GoalContribution<F>} contributors
 * @return a mapping to goals
 */
export function goalContributors<F extends SdmContext = PushListenerInvocation>(
    contributor: GoalContribution<F>,
    ...contributors: Array<GoalContribution<F>>): Mapping<F, Goals> {
    return new AdditiveGoalSetter("Contributed", [contributor].concat(contributors));
}
