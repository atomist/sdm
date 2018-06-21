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
import { computeShaOf } from "../../api-helper/misc/sha";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { PushTest } from "../../api/mapping/PushTest";
import { FingerprinterRegistration, FingerprinterResult } from "../../api/registration/FingerprinterRegistration";
import { IsNode } from "./nodePushTests";

/**
 * Compute a fingerprint from a package-lock.json file.
 * Unlike a Maven POM, we can rely on ordering in a package lock file
 * so do not need to sort the data ourselves before sha-ing.
 */
export class PackageLockFingerprinter implements FingerprinterRegistration {

    public readonly name = "PackageLockFingerprinter";

    public readonly pushTest: PushTest = IsNode;

    public async action(cri: PushImpactListenerInvocation): Promise<FingerprinterResult> {
        const lockFile = await cri.project.getFile("package-lock.json");
        if (!lockFile) {
            return [];
        }
        try {
            const content = await lockFile.getContent();
            const json = JSON.parse(content);
            const deps = json.dependencies;
            const dstr = JSON.stringify(deps);
            return {
                name: "dependencies",
                abbreviation: "deps",
                version: "0.1",
                sha: computeShaOf(dstr),
                data: json,
            };
        } catch (err) {
            logger.warn("Unable to compute package-lock.json fingerprint: %s", err.message);
            return [];
        }
    }
}
