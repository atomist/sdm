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

import { predicatePushTest, PredicatePushTest } from "../../../api/mapping/PushTest";
import { hasFile } from "../../../api/mapping/support/commonPushTests";

export const IsNode: PredicatePushTest = hasFile("package.json");

export const IsAtomistAutomationClient: PredicatePushTest = predicatePushTest("Is Automation Client", async p => {
    try {
        const pjFile = await p.getFile("package.json");
        const pjString = await pjFile.getContent();

        interface PJ {
            dependencies: {
                [key: string]: string;
            };
        }

        const pj: PJ = JSON.parse(pjString);
        if (!pj || !pj.dependencies) {
            return false;
        }
        return !!(pj.dependencies["@atomist/automation-client"] || pj.dependencies["@atomist/sdm"]);
    } catch (e) {
        return false;
    }
});

export const HasPackageLock = hasFile("package-lock.json");
