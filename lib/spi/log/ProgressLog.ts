/*
 * Copyright © 2019 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { WritableLog } from "@atomist/automation-client/lib/util/child_process";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";

/**
 * Log abstraction for output of a specific activity. Not intended as a long-running log
 * but for a short-lived activity.
 * Not a technical log of this project but a log of meaningful activity
 * on behalf of users.
 */
export interface ProgressLog extends WritableLog {

    /**
     * Name. Should relate to the immediate activity we're logging.
     */
    readonly name: string;

    /**
     * Return the url of the log if it is persisted
     */
    readonly url?: string;

    flush(): Promise<void>;

    close(): Promise<void>;

    /**
     * Is this logger available at this point in time?
     * E.g. if it's backed by a service, is that service up?
     */
    isAvailable(): Promise<boolean>;

    /** Function that appends to the log. */
    write(log: string, ...args: any[]): void;
}

/**
 * Function to create a ProgressLog for a given goal execution
 */
export type ProgressLogFactory = (context: HandlerContext, sdmGoal: SdmGoalEvent) => Promise<ProgressLog>;
