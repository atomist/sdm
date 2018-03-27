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

import { logger } from "@atomist/automation-client";
import { filesChangedSince } from "../../../../../util/git/filesChangedSince";
import { PushTest, pushTest } from "../../../PushTest";

import * as _ from "lodash";

/**
 * Veto if change to deployment unit doesn't seem important enough to
 * build and deploy
 * @param {ProjectListenerInvocation} pci
 * @return {Promise<void>}
 * @constructor
 */
export const MaterialChangeToJavaRepo = pushTest("Material change to Java repo", async pci => {
    const beforeSha = _.get(pci, "push.before.sha");
    if (!beforeSha) {
        logger.info("Cannot determine if change is material on %j: can't find old sha", pci.id);
        return true;
    }
    const changedFiles = await filesChangedSince(pci.project, pci.push.before.sha);
    logger.debug(`MaterialChangeToJavaRepo: Changed files are [${changedFiles.join(",")}]`);
    if (changedFiles.some(f => f.endsWith(".java")) ||
        changedFiles.some(f => f.endsWith(".html")) ||
        changedFiles.some(f => f.endsWith(".json")) ||
        changedFiles.some(f => f.endsWith(".yml")) ||
        changedFiles.some(f => f.endsWith(".xml"))
    ) {
        logger.debug("Change is material on %j: changed files=[%s]", pci.id, changedFiles.join(","));
        return true;
    }
    logger.debug("Change is immaterial on %j: changed files=[%s]", pci.id, changedFiles.join(","));
    // await pci.addressChannels(`Sorry. I'm not going to waste electricity on changes to [${changedFiles.join(",")}]`);
    return false;
});
