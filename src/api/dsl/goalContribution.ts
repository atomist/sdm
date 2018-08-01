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
import { Goal } from "../goal/Goal";
import { Goals } from "../goal/Goals";
import { PushListenerInvocation } from "../listener/PushListener";
import { LockingGoal } from "../machine/wellKnownGoals";
import {
    Mapping,
    NeverMatch,
} from "../mapping/Mapping";
import {
    GoalComponent,
    toGoals,
} from "./GoalComponent";

export type GoalContribution<F> = Mapping<F, GoalComponent>;

/**
 * An additive goal setter assembles the goals contributed by all the contributors.
 */
class AdditiveGoalSetter<F extends SdmContext> implements Mapping<F, Goals> {

    private readonly contributors: Array<Mapping<F, Goal[]>> = [];

    public get label(): string {
        return this.contributors.filter(c => (c as any).label)
            .map(c => (c as any).label).join(", ");
    }

    constructor(public name: string, contributors: Array<GoalContribution<F>>) {
        this.contributors = contributors.map(c => {
            logger.info("Creating contributor '%s' of %s", c.name, contributors.map(con => con.name));
            return {
                name: c.name,
                label: (c as any).label,
                async mapping(p) {
                    const r = await c.mapping(p);
                    logger.info("Contributor '%s' of [%s] returned %s",
                        c.name,
                        contributors.map(con => con.name), !!r ? toGoals(r).goals.map(g => g.name) : "undefined");
                    if (!r) {
                        return r as any;
                    }
                    return toGoals(r).goals;
                },
            };
        });
    }

    public async mapping(p: F): Promise<NeverMatch | Goals | undefined> {
        const names = [];
        const contributorGoals: Goal[][] = [];

        for (const c of this.contributors) {
            const mapping = await c.mapping(p);
            if (mapping && mapping.length > 0) {
                if ((c as any).label) {
                    names.push((c as any).label);
                } else {
                    names.push(c.name);
                }
                contributorGoals.push(mapping.filter(g => g !== LockingGoal));
                // If we find the special locking goal, don't add any further goals
                if (mapping.includes(LockingGoal)) {
                    logger.info("Stopping goal contribution analysis, because %s has locked the goal set", c.name);
                    break;
                }
            }
        }

        const uniqueGoals: Goal[] = _.uniq(_.flatten(contributorGoals.filter(x => !!x)));
        logger.info("%d contributors (%s): Contributor goal names=[%s]; Unique goal names=[%s]; correlationId=%s",
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
 * Duplicates will be removed.
 * @param contributor first contributor
 * @param {GoalContribution<F>} contributors
 * @return a mapping to goals
 */
export function goalContributors<F extends SdmContext = PushListenerInvocation>(
    contributor: GoalContribution<F>,
    ...contributors: Array<GoalContribution<F>>): Mapping<F, Goals> {
    const all = [contributor].concat(contributors);
    return new AdditiveGoalSetter("Contributed", all);
}

/**
 * Enrich the given push mapping with our own contributions
 * @param {Mapping<F extends SdmContext, Goals>} mapping
 * @param {GoalContribution<F extends SdmContext>} contributor
 * @param {GoalContribution<F extends SdmContext>} contributors
 * @return {Mapping<F extends SdmContext, Goals>}
 */
export function enrichGoalSetters<F extends SdmContext = PushListenerInvocation>(
    mapping: GoalContribution<F>,
    contributor: GoalContribution<F>,
    ...contributors: Array<GoalContribution<F>>): Mapping<F, Goals> {
    return new AdditiveGoalSetter(`${mapping.name}-enriched`, [mapping, contributor].concat(contributors));
}
