/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PushMapping } from "../../common/listener/PushMapping";
import { PushTest } from "../../common/listener/PushTest";
import { PushRule, PushRuleExplanation } from "../../common/listener/support/PushRule";
import { AnyPush } from "../../common/listener/support/pushtest/commonPushTests";
import { Builder } from "../../spi/build/Builder";
import { Target } from "../../common/delivery/deploy/deploy";
import { Goal } from "../../common/delivery/goals/Goal";

export function when(guard1: PushTest, ...guards: PushTest[]): PushRuleExplanation<PushRule<Target<any>>> {
    return new PushRuleExplanation(new PushRule(guard1, guards));
}

export function setDefault(t: Target<any>): PushMapping<Target<any>> {
    return new PushRule<Target<any>>(AnyPush, [], "On any push").set(t);
}
