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

import * as findUp from "find-up";
import * as path from "path";
import * as trace from "stack-trace";
import { ExtensionPackMetadata } from "../../api/machine/ExtensionPack";

/**
 * Read ExtensionPackMetadata from the modules package.json.
 * @param {string} name
 * @returns {ExtensionPackMetadata}
 */
export function metadata(name?: string): ExtensionPackMetadata {
    const pathToCallingFunction = trace.get()[1].getFileName();
    const pj = require(findUp.sync("package.json", { cwd: path.resolve(path.dirname(pathToCallingFunction)) }));

    return {
        name: name ? `${pj.name}:${name.toLocaleLowerCase()}` : pj.name,
        vendor: pj.author && pj.author.name ? pj.author.name : pj.author,
        version: pj.version ? pj.version : "",
        tags: pj.keywords ? pj.keywords : [],
    };
}
