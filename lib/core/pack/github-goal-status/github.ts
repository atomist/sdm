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

import { metadata } from "../../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import {
    isGitHubAction,
    isInLocalMode,
} from "../../internal/machine/modes";
import {
    createPendingGitHubStatusOnGoalSet,
    setGitHubStatusOnGoalCompletion,
} from "./statusSetters";

/**
 * Manage a GitHub status per SDM
 */
export function githubGoalStatusSupport(): ExtensionPack {
    return {
        ...metadata("github-goal-status"),
        configure: sdm => {
            if (!isGitHubAction() && !isInLocalMode()) {
                sdm.addGoalsSetListener(createPendingGitHubStatusOnGoalSet(sdm));
                sdm.addGoalCompletionListener(setGitHubStatusOnGoalCompletion(sdm));
            }
        },
    };
}

/**
 * @deprecated use githubGoalStatusSupport
 */
export function gitHubGoalStatus(): ExtensionPack {
    return githubGoalStatusSupport();
}
