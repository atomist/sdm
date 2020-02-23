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

import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { toArray } from "../../util/misc/array";
import {
    DeliveryGoals,
    GoalData,
} from "../configure";
import { ConfigureYamlOptions } from "./configureYaml";
import {
    GoalMaker,
    mapGoals,
} from "./mapGoals";
import {
    mapTests,
    PushTestMaker,
} from "./mapPushTests";
import { camelCase } from "./util";

export async function mapRules(rules: any,
                               goalData: GoalData,
                               sdm: SoftwareDeliveryMachine,
                               options: ConfigureYamlOptions<any>,
                               additionalGoals: DeliveryGoals,
                               goalMakers: Record<string, GoalMaker>,
                               testMakers: Record<string, PushTestMaker>): Promise<void> {

    for (const rule of camelCase(toArray(rules))) {
        if (!rule.name) {
            throw new Error(`Property 'name' missing in push rule:\n${JSON.stringify(rule, undefined, 2)}`);
        }
        if (!rule.goals) {
            throw new Error(`Property 'goals' missing in push rule:\n${JSON.stringify(rule, undefined, 2)}`);
        }

        const test = !!rule.tests || !!rule.test ? await mapTests(
            rule.tests || rule.test,
            options.tests || {},
            testMakers) : [];

        const goals = await mapGoals(
            sdm,
            rule.goals,
            additionalGoals,
            goalMakers,
            options.tests || {},
            testMakers);
        const dependsOn = rule.dependsOn;

        goalData[rule.name] = {
            test: toArray(test).length > 0 ? test : undefined,
            dependsOn,
            goals,
        };
    }
}
