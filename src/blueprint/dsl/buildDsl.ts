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

import { PushTest } from "../../api/mapping/PushTest";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { PushRule } from "../../api/mapping/support/PushRule";
import { Builder } from "../../spi/build/Builder";

export function when(guard1: PushTest, ...guards: PushTest[]): PushRule<Builder> {
    return new PushRule(guard1, guards);
}

export function setDefault(builder: Builder): PushRule<Builder> {
    return new PushRule<Builder>(AnyPush, [], "On any push").set(builder);
}
