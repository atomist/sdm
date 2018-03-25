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

import { ProjectListenerInvocation } from "./Listener";
import { PushMapping } from "./PushMapping";

/**
 * Return true if we like this push. Used in goal setting etc.
 */
export interface PushTest extends PushMapping<boolean> {

}

/**
 * Convenient factory function for PushTest instances
 * @param {string} name
 * @param valueForPush test function
 * @return {PushTest}
 */
export function pushTest(name: string, valueForPush: (p: ProjectListenerInvocation) => Promise<boolean>): PushTest {
    return {
        name,
        valueForPush,
    };
}
