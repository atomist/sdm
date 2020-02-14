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
import { SkillOutput } from "../../typings/types";
import { StatefulPushListenerInvocation } from "../dsl/goalContribution";
import { matchStringOrRegexp } from "./goalTest";
import { PushTest } from "./PushTest";
import { AnyPush } from "./support/commonPushTests";

/**
 * Extension to PushTest to pre-condition on SkillOutput events, so called output tests
 */
export interface OutputTest extends PushTest {
    pushTest: PushTest;
}

export function isOutput(options: {
    type?: string,
    classifier?: string | RegExp,
    pushTest?: PushTest,
} = {}): OutputTest {
    return outputTest(
        `is output ${JSON.stringify(options)}`,
        async g => {
            if (!!options.type && !matchStringOrRegexp(options.type, g.type)) {
                return false;
            }
            if (!!options.classifier && !matchStringOrRegexp(options.classifier, g.classifier)) {
                return false;
            }
            return true;
        },
        options.pushTest,
    );
}

export function outputTest(name: string,
                           outputMapping: (goal: SkillOutput, pli: StatefulPushListenerInvocation) => Promise<boolean>,
                           pushTest: PushTest = AnyPush): OutputTest {
    return {
        name,
        mapping: async pli => {
            const trigger = (pli?.context as any as AutomationContextAware)?.trigger;
            if (!!trigger && isEventIncoming(trigger)) {
                const output = _.get(trigger, "data.SkillOutput[0]") as SkillOutput;
                if (!!output) {
                    const match = await outputMapping(output, pli);
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
