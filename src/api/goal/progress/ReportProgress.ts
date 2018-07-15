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

import { SdmGoalEvent } from "../SdmGoalEvent";

/**
 * Signals a certain phase was entered during Goal execution.
 */
export interface Progress {

    /** Simple string label indicating the phase */
    phase?: string;

}

/**
 * Report on the Progress of a Goal execution based on given log extract.
 * Usually this is the most current log line produced by the Goal execution.
 *
 * The returned Progress.phase will be stored on the Goal and overridden when
 * a new phase has been reported.
 *
 * If the foal fails, the failing phase is preserved. In all other cases the
 * phase will be reset on goal completion. 
 */
export type ReportProgress = (log: string, sdmGoal: SdmGoalEvent) => Progress;
