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

import { logger } from "@atomist/automation-client";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as stringify from "json-stringify-safe";

/**
 * Try to work out whether a project was edited, looking at git status
 * if we can't find out from the edit result
 * @param {EditResult} editResult
 * @return {Promise<EditResult>}
 */
export async function confirmEditedness(editResult: EditResult): Promise<EditResult> {
    if (editResult.edited === undefined) {
        const gs = await (editResult.target as GitProject).gitStatus();
        logger.debug("Git status: " + stringify(gs));
        return {
            ...editResult,
            edited: !gs.isClean,
        };
    } else {
        return editResult;
    }
}
