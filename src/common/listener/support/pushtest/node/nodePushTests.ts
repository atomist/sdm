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
import { PushTest, pushTest } from "../../../PushTest";

export const IsNode: PushTest = pushTest("Is Node", async pi => {
    try {
        const f = await pi.project.findFile("package.json");
        const contents = await f.getContent();
        const json = JSON.parse(contents);
        logger.info("Node PushTest on %s:%s returning TRUE", pi.project.id.owner, pi.project.id.repo);
        return true;
    } catch (err) {
        logger.info("Node PushTest on %s:%s returning FALSE (%s)",
            pi.project.id.owner, pi.project.id.repo, err);
        return false;
    }
});
