/*
 * Copyright © 2019 Atomist, Inc.
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

import { AutomationContextAware } from "@atomist/automation-client";
import { isEventIncoming } from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import * as _ from "lodash";
import { SdmGoalState } from "../../typings/types";
import { StatefulPushListenerInvocation } from "../dsl/goalContribution";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { PushTest } from "./PushTest";
import { AnyPush } from "./support/commonPushTests";

/**
 * Extension to PushTest to pre-condition on SDM goal events, so called GoalTests
 */
export interface GoalTest extends PushTest {
    pushTest: PushTest;
}

export function isGoal(options: { name?: RegExp, state?: SdmGoalState, output?: RegExp, pushTest?: PushTest, data?: RegExp } = {}): GoalTest {
    return goalTest(
        `is goal ${JSON.stringify(options)}`,
        async g => {
            if (!!options.name && !options.name.test(g.name)) {
                return false;
            }
            if (!!options.state && options.state !== g.state) {
                return false;
            }
            if (!!options.output) {
                const data = JSON.parse(g.data || "{}");
                const outputs: string[] = data["@atomist/sdm/output"];
                if (!outputs) {
                    return false;
                } else if (!outputs.some(o => options.output.test(o))) {
                    return false;
                }
            }
            if (!!options.data && !options.data.test(g.data)) {
                return false;
            }
            return true;
        },
        options.pushTest,
    );
}

export function goalTest(name: string,
                         goalMapping: (goal: SdmGoalEvent, pli: StatefulPushListenerInvocation) => Promise<boolean>,
                         pushTest: PushTest = AnyPush): GoalTest {
    return {
        name,
        mapping: async pli => {
            const trigger = (pli.context as any as AutomationContextAware).trigger;
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
 * Wrap a PushTest to make sure it doesn't get the change to match on goal planning
 * based on goal events
 */
export function notGoalTest(pushTest: PushTest): PushTest {
    return {
        name: pushTest.name,
        mapping: async pli => {
            const trigger = (pli.context as any as AutomationContextAware).trigger;
            if (!!trigger && isEventIncoming(trigger)) {
                const goal = _.get(trigger, "data.SdmGoal[0]") as SdmGoalEvent;
                if (!!goal) {
                    return false;
                }
            }
            return pushTest.mapping(pli);
        },
    };
}
