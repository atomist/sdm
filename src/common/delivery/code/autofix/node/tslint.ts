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

import { asSpawnCommand } from "../../../../../util/misc/spawned";
import { hasFile } from "../../../../listener/support/pushtest/commonPushTests";
import { IsNode } from "../../../../listener/support/pushtest/node/nodePushTests";
import { IsTypeScript } from "../../../../listener/support/pushtest/node/tsPushTests";
import { allSatisfied } from "../../../../listener/support/pushtest/pushTestUtils";
import {
    DevelopmentEnvOptions,
    Install,
} from "../../../build/local/npm/npmBuilder";
import { AutofixRegistration } from "../AutofixRegistration";
import { spawnedCommandAutofix } from "../spawnedCommandAutofix";

export const tslintFix: AutofixRegistration = spawnedCommandAutofix(
    "tslint",
    allSatisfied(IsTypeScript, IsNode, hasFile("tslint.json")),
    {ignoreFailure: true, considerOnlyChangedFiles: false},
    Install,
    asSpawnCommand("npm run lint:fix", DevelopmentEnvOptions));
