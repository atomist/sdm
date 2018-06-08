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

import { HandlerContext, HandlerResult } from "@atomist/automation-client";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { OnAnyRequestedSdmGoal } from "../../../typings/types";

/**
 * Launch a goal in an isolated environment (container or process) for fulfillment.
 */
export type IsolatedGoalLauncher = (goal: OnAnyRequestedSdmGoal.SdmGoal,
                                    ctx: HandlerContext,
                                    progressLog: ProgressLog) => Promise<HandlerResult>;
