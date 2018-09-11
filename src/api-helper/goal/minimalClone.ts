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

import { CloneOptions } from "@atomist/automation-client/spi/clone/DirectoryManager";
import { PushFields } from "../../typings/types";

export function minimalClone(push: PushFields.Fragment, extras: Partial<CloneOptions> = {}): CloneOptions {
    // we need at least the commits of the push + 1 to be able to diff it
    return { depth: push.commits.length + 1, ...extras };
}
