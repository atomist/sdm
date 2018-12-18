/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import * as _ from "lodash";
import { SdmContext } from "../context/SdmContext";
import { Locking } from "../goal/common/Locking";
import { Goal } from "../goal/Goal";
import { Goals } from "../goal/Goals";
import { PushListenerInvocation } from "../listener/PushListener";
import {
    GoalSetter,
    GoalSettingCompositionStyle,
    GoalSettingStructure,
} from "../mapping/GoalSetter";
import {
    mapMapping,
    Mapping,
    NeverMatch,
} from "../mapping/Mapping";
import { Predicated } from "../mapping/PredicateMapping";
import {
    GoalComponent,
    toGoals,
} from "./GoalComponent";

export interface GoalContribution<F> extends Mapping<F, GoalComponent>, Predicated<F> {

}

/**
 * Add state to an invocation. Only available in memory.
 * @param S type of the fact to add.
 */
export interface StatefulInvocation<S> extends SdmContext {

    facts?: S;
}

/**
 * Within evaluation of push rules we can manage state on a push.
 * This interface allows state. This state will not be persisted.
 */
export interface StatefulPushListenerInvocation<S> extends PushListenerInvocation, StatefulInvocation<S> {

}

/**
 * Enrich the invocation, attaching some facts.
 * The returned object will be merged with any facts already on the invocation.
 * @param {(f: (StatefulInvocation<FACT>)) => Promise<FACT>} compute additional facts. 
 * @return {GoalContribution<F>}
 */
export function attachFacts<FACT, F extends SdmContext = PushListenerInvocation>(compute: (f: StatefulInvocation<FACT>) => Promise<FACT>): GoalContribution<F> {
    return {
        name: "attachFacts",
        mapping: async f => {
            const withAdditionalFact = f as F & StatefulInvocation<FACT>;
            if (!withAdditionalFact.facts) {
                withAdditionalFact.facts = {} as FACT;
            }
            const additionalState = await compute(withAdditionalFact);
            _.merge(withAdditionalFact.facts, additionalState);
            return undefined;
        },
    };
}

/**
 * An additive goal setter assembles the goals contributed by all the contributors.
 */
class AdditiveGoalSetter<F extends SdmContext> implements GoalSetter<F>, GoalSettingStructure<F, Goals> {

    public get label(): string {
        return this.contributors.filter(c => (c as any).label)
            .map(c => (c as any).label).join(", ");
    }

    constructor(public readonly name: string, public readonly contributors: Array<GoalContribution<F>>) {
    }

    get structure() {
        return {
            components: this.contributors.map(vague => mapMapping(vague, toGoals)),
            compositionStyle: GoalSettingCompositionStyle.AllMatches,
        };
    }

    public async mapping(p: F): Promise<NeverMatch | Goals | undefined> {
        const names = [];
        const contributorGoals: Goal[][] = [];

        for (const c of this.contributors) {
            const mapping = await c.mapping(p);
            if (mapping) {
                const goals = toGoals(mapping);
                if ((c as any).label) {
                    names.push((c as any).label);
                } else {
                    names.push(c.name);
                }
                contributorGoals.push(goals.goals.filter(g => g !== Locking));
                // If we find the special locking goal, don't add any further goals
                if (goals.goals.includes(Locking)) {
                    logger.info("Stopping goal contribution analysis, because %s has locked the goal set", c.name);
                    break;
                }
            }
        }

        const uniqueGoals: Goal[] = _.uniq(_.flatten(contributorGoals.filter(x => !!x)));
        logger.debug("%d contributors (%s): Contributor goal names=[%s]; Unique goal names=[%s]; correlationId=%s",
            this.contributors.length,
            this.contributors.map(c => c.name),
            contributorGoals.map(a => !!a ? a.map(b => b.name).join() : "undefined").join(": "),
            uniqueGoals.map(g => g.name),
            p.context.correlationId);
        return uniqueGoals.length === 0 ?
            undefined :
            new Goals(names.join(", "), ...uniqueGoals);
    }

}

/**
 * Contribute goals based on a series of contribution rules.
 *
 * Instead of stopping at the first match, each push will get _all_ the goals it qualifies for.
 *
 * Duplicates will be removed.
 *
 * @param contributor first contributor
 * @param {GoalContribution<F>} contributors
 * @return a mapping to goals
 */
export function goalContributors<F extends SdmContext = StatefulPushListenerInvocation<any>>(
    contributor: GoalContribution<F>,
    ...contributors: Array<GoalContribution<F>>): Mapping<F, Goals> {
    if (contributors.length === 0) {
        return mapMapping(contributor, toGoals);
    }
    return enrichGoalSetters(contributor, contributors[0], ...contributors.slice(1));
}

/**
 * Enrich the given push mapping with our own contributions
 * @param {Mapping<F extends SdmContext, Goals>} mapping
 * @param {GoalContribution<F extends SdmContext>} contributor
 * @param {GoalContribution<F extends SdmContext>} contributors
 * @return {Mapping<F extends SdmContext, Goals>}
 */
export function enrichGoalSetters<F extends SdmContext = StatefulPushListenerInvocation<any>>(
    mapping: GoalContribution<F>,
    contributor: GoalContribution<F>,
    ...contributors: Array<GoalContribution<F>>): Mapping<F, Goals> & GoalSettingStructure<F, Goals> {
    if (isAdditiveGoalSetter(mapping)) {
        return new AdditiveGoalSetter(`${mapping.name}-enriched`,
            [...mapping.contributors, contributor, ...contributors],
        );
    }
    return new AdditiveGoalSetter(`${mapping.name}-enriched`,
        [mapping, contributor].concat(contributors),
    );
}

function isAdditiveGoalSetter(a: GoalContribution<any>): a is AdditiveGoalSetter<any> {
    const maybe = a as AdditiveGoalSetter<any>;
    return !!maybe && !!maybe.contributors && !!maybe.mapping;
}
