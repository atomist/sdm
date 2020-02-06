/*
 * Copyright © 2020 Atomist, Inc.
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

import { AutomationContextAware } from "@atomist/automation-client/lib/HandlerContext";
import { isEventIncoming } from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import * as _ from "lodash";
import { SdmGoalState } from "../../typings/types";
import { StatefulPushListenerInvocation } from "../dsl/goalContribution";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { PushListenerInvocation } from "../listener/PushListener";
import { PredicateMapping } from "./PredicateMapping";
import { PushTest } from "./PushTest";
import { AnyPush } from "./support/commonPushTests";

/**
 * Extension to PushTest to pre-condition on SDM goal events, so called GoalTests
 */
export interface GoalTest extends PushTest {
    pushTest: PushTest;
}

export function isGoal(options: {
    name?: string | RegExp,
    state?: SdmGoalState,
    output?: string | RegExp,
    pushTest?: PushTest,
    data?: string | RegExp,
} = {}): GoalTest {
    return goalTest(
        `is goal ${JSON.stringify(options)}`,
        async g => {
            if (!!options.name &&
                !matchStringOrRegexp(options.name, `${g.registration}/${g.name}`) &&
                !matchStringOrRegexp(options.name, `${g.registration}/${g.uniqueName}`)) {
                return false;
            }
            if (!!options.state && options.state !== g.state) {
                return false;
            }
            if (!!options.output) {
                const data = JSON.parse(g.data || "{}");
                const outputs: Array<{ classifier: string }> = data["@atomist/sdm/output"];
                if (!outputs) {
                    return false;
                } else if (!outputs.some(o => matchStringOrRegexp(options.output, o.classifier))) {
                    return false;
                }
            }
            if (!!options.data && !matchStringOrRegexp(options.data, g.data)) {
                return false;
            }
            return true;
        },
        options.pushTest,
    );
}

export function matchStringOrRegexp(pattern: string | RegExp, toMatch: string): boolean {
    if (typeof pattern === "string") {
        return pattern === toMatch;
    } else {
        return pattern.test(toMatch);
    }
}

export function goalTest(name: string,
                         goalMapping: (goal: SdmGoalEvent, pli: StatefulPushListenerInvocation) => Promise<boolean>,
                         pushTest: PushTest = AnyPush): GoalTest {
    return {
        name,
        mapping: async pli => {
            const trigger = (pli?.context as any as AutomationContextAware)?.trigger;
            if (!!trigger && isEventIncoming(trigger)) {
                const goal = _.get(trigger, "data.SdmGoal[0]") as SdmGoalEvent;
                if (!!goal) {
                    const match = await goalMapping(goal, pli);
                    if (!!match) {
                        if (!pli.project) {
                            return true;
                        } else {
                            return pushTest.mapping(pli);
                        }
                    }
                }
            }
            return false;
        },
        pushTest,
    };
}

/**
 * Wrap a PushTest to make sure it doesn't get the chance to match on goal planning
 * based on goal events
 */
export function notGoalOrOutputTest(pushTest: PushTest): PushTest {
    return {
        ...pushTest,
        mapping: async pli => {
            const trigger = (pli?.context as any as AutomationContextAware)?.trigger;
            if (!!trigger && isEventIncoming(trigger)) {
                const goal = _.get(trigger, "data.SdmGoal[0]") || _.get(trigger, "data.SkillOutput[0]");
                if (!!goal) {
                    return false;
                }
            }
            return pushTest.mapping(pli);
        },
    };
}

export function wrapPredicateMapping<P extends PushListenerInvocation = PushListenerInvocation>(
    guards: PredicateMapping<P>): PredicateMapping<P> {
    return wrapTest(guards);
}

export function wrapTest<P extends PushListenerInvocation = PushListenerInvocation>(
    test: PredicateMapping<P>): PredicateMapping<P> {
    if (!!(test as any).pushTest) {
        return test;
    } else {
        return notGoalOrOutputTest(test);
    }
}
