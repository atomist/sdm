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

/* tslint:disable:deprecation */

import { SpawnCommand } from "@atomist/automation-client";
import { CodeTransform } from "../../../api/registration/CodeTransform";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { spawnCodeTransform } from "./spawnCodeTransform";

/**
 * Create a code transform wrapping spawned local commands
 * run on the project. For example, allows use of tslint as an editorCommand.
 * @param commands to execute
 * @param log progress log
 * @return code transform function
 * @deprecated use spawnCodeTransform
 */
export function localCommandsCodeTransform(commands: SpawnCommand[], log?: ProgressLog): CodeTransform {
    return spawnCodeTransform(commands, log);
}
