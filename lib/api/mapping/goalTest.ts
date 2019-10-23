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
import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { PushTest } from "./PushTest";
import { AnyPush } from "./support/commonPushTests";

/**
 * Extension to PushTest to pre-condition on SDM goal events, so called GoalTests
 */
// tslint:disable-next-line:no-empty-interface
export interface GoalTest extends PushTest {
    pushTest: PushTest;
}

export function goalTest(name: string,
                         goalMapping: (goal: SdmGoalEvent) => Promise<boolean>,
                         pushTest: PushTest = AnyPush): GoalTest {
    return {
        name,
        mapping: async pli => {
            const trigger = (pli.context as any as AutomationContextAware).trigger;
            if (!!trigger && isEventIncoming(trigger)) {
                const goal = _.get(trigger, "data.SdmGoal[0]") as SdmGoalEvent;
                if (!!goal) {
                    const match = await goalMapping(goal);
                    if (!!match) {
                        return pushTest.mapping(pli);
                    }
                }
            }
            return false;
        },
        pushTest,
    };
}

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
