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

import { SpawnLogInvocation } from "../../../api-helper/misc/child_process";
import { PushTest } from "../../../api/mapping/PushTest";
import {
    AutofixRegistration,
    AutofixRegistrationOptions,
} from "../../../api/registration/AutofixRegistration";
import { spawnCodeTransform } from "../../command/transform/spawnCodeTransform";

/**
 * Create an autofix registration from one or more external commands.
 */
export function spawnAutofix(name: string,
                             pushTest: PushTest,
                             options: AutofixRegistrationOptions,
                             command1: SpawnLogInvocation,
                             ...additionalCommands: SpawnLogInvocation[]): AutofixRegistration {
    return {
        name,
        transform: spawnCodeTransform([command1, ...additionalCommands]),
        pushTest,
        options,
    };
}
