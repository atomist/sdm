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

import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import * as _ from "lodash";
import { metadata } from "../../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import { SdmGoalState } from "../../../typings/types";
import { isInLocalMode } from "../../internal/machine/modes";
import {
    cancelGoalSetsCommand,
    listPendingGoalSetsCommand,
} from "./cancelGoals";
import { manageGoalSetsTrigger } from "./manageGoalSets";
import { resetGoalsCommand } from "./resetGoals";
import { setGoalStateCommand } from "./setGoalState";

/**
 * Configuration options for the goal state support
 */
export interface GoalStateOptions {
    /** Configure the goal cancellation support */
    cancellation?: {
        /** Enable goal cancellation based on timeouts */
        enabled?: boolean;
        /**
         * Optionally set the timeout after which goals should be cancelled.
         * Defaults to 1 hour.
         */
        timeout?: number;
        /**
         * Optional state the goal should be set to when it times out
         * Defaults to SdmGoalState.canceled
         */
        state?: SdmGoalState.canceled | SdmGoalState.failure;
    };
}

/**
 * Allow goal setting
 */
export function goalStateSupport(options?: GoalStateOptions): ExtensionPack {
    return {
        ...metadata("goal-state"),
        configure: sdm => {
            if (isInLocalMode()) {
                logger.warn("Setting goal state is not available in local mode.");
                logger.warn("Resetting goals does not work in local mode. Use `atomist trigger post-commit` instead.");
            } else {
                sdm.addCommand(setGoalStateCommand(sdm));
                sdm.addCommand(resetGoalsCommand(sdm));
                sdm.addCommand(cancelGoalSetsCommand(sdm));
                sdm.addCommand(listPendingGoalSetsCommand(sdm));

                if ((cluster.isMaster || !_.get(sdm.configuration, "cluster.enabled")) &&
                    !process.env.ATOMIST_ISOLATED_GOAL &&
                    !!options && !!options.cancellation && !!options.cancellation.enabled) {
                    logger.debug(`Timeout based goal cancellation enabled for this SDM`);
                    sdm.addTriggeredListener({
                        trigger: { interval: 1000 * 30 },
                        listener: manageGoalSetsTrigger(options.cancellation),
                    });
                }
            }
        },
    };
}

/**
 * @deprecated use goalStateSupport
 */
export function goalState(): ExtensionPack {
    return goalStateSupport();
}
