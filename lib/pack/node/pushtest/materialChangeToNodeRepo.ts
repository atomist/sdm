/*
 * Copyright © 2020 Atomist, Inc.
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

import { logger } from "@atomist/automation-client/lib/util/logger";
import {
    anyFileChangedSuchThat,
    anyFileChangedWithExtension,
    filesChangedSince,
} from "../../../api-helper/misc/git/filesChangedSince";
import { pushTest, PushTest } from "../../../api/mapping/PushTest";

const FilesWithExtensionToWatch = ["js", "ts", "json", "yml", "xml", "html", "graphql", "jsx", "tsx", "sh"];
const FilesToWatch = ["Dockerfile"];

/**
 * Veto if change to deployment unit doesn't seem important enough to
 * build and deploy
 */
export const MaterialChangeToNodeRepo: PushTest = pushTest("Material change to Node repo", async pci => {
    const changedFiles = await filesChangedSince(pci.project, pci.push);
    if (!changedFiles) {
        logger.info("Cannot determine if change is material on %j: can't enumerate changed files", pci.id);
        return true;
    }
    logger.debug(`MaterialChangeToNodeRepo: Changed files are [${changedFiles.join(",")}]`);
    if (
        anyFileChangedWithExtension(changedFiles, FilesWithExtensionToWatch) ||
        anyFileChangedSuchThat(changedFiles, path => FilesToWatch.some(f => path === f))
    ) {
        logger.debug("Change is material on %j: changed files=[%s]", pci.id, changedFiles.join(","));
        return true;
    }
    logger.debug("Change is immaterial on %j: changed files=[%s]", pci.id, changedFiles.join(","));
    return false;
});
