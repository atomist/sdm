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

import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { HttpServiceGoals } from "../../../common/delivery/goals/common/httpServiceGoals";
import { ApplyGoalsParameters, applyGoalsToCommit } from "../../../handlers/events/delivery/goals/SetGoalsOnPush";

export const applyHttpServiceGoals: HandleCommand<ApplyGoalsParameters> =
    commandHandlerFrom(applyGoalsToCommit(HttpServiceGoals),
        ApplyGoalsParameters, "ApplyHttpServiceGoals",
        "reset goals for an http service",
        "trigger sdm for http service");
