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

import { hasCommit } from "../../../api-helper/pushtest/commit";
import {
    pushTest,
    PushTest,
} from "../../../api/mapping/PushTest";
import {
    hasFile,
    isBranch,
    ToDefaultBranch,
} from "../../../api/mapping/support/commonPushTests";

const DefaultSkillConfigurationKeys: SkillConfiguredOptions = {
    hasCommit: "hasCommit",
    hasFile: "hasFile",
    isBranch: "isBranch",
    isDefaultBranch: "isDefaultBranch",
};

export interface SkillConfiguredOptions {
    hasCommit?: string;
    hasFile?: string;
    isBranch?: string;
    isDefaultBranch?: string;
}

/**
 * Push test that tests against some well-known pushTests based on skill
 * configuration
 */
export function isSkillConfigured(keys?: SkillConfiguredOptions): PushTest {

    const keysToUse = {
        ...DefaultSkillConfigurationKeys,
        ...keys,
    };

    return pushTest("is skill configured", async pli => {

        const skillConfiguration = pli.skill?.configuration?.parameters || {};

        if (!!skillConfiguration[keysToUse.hasFile]) {
            if (!(await hasFile(skillConfiguration[keysToUse.hasFile]).mapping(pli))) {
                return false;
            }
        }

        if (!!skillConfiguration[keysToUse.isBranch]) {
            const branchRegExp = new RegExp(skillConfiguration[keysToUse.isBranch]);
            if (!(await isBranch(branchRegExp).mapping(pli))) {
                return false;
            }
        }

        if (!!skillConfiguration[keysToUse.isDefaultBranch]) {
            if (!(await ToDefaultBranch.mapping(pli))) {
                return false;
            }
        }

        if (!!skillConfiguration[keysToUse.hasCommit]) {
            const commitRegExp = new RegExp(skillConfiguration[keysToUse.hasCommit]);
            if (!(await hasCommit(commitRegExp).mapping(pli))) {
                return false;
            }
        }

        return true;
    });
}
