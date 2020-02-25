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

import {
    EventHandler,
    Value,
} from "@atomist/automation-client/lib/decorators";
import { automationClientInstance } from "@atomist/automation-client/lib/globals";
import { subscription } from "@atomist/automation-client/lib/graph/graphQL";
import {
    EventFired,
    HandleEvent,
} from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    HandlerResult,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { ClusterWorkerRequestProcessor } from "@atomist/automation-client/lib/internal/transport/cluster/ClusterWorkerRequestProcessor";
import { safeExit } from "@atomist/automation-client/lib/internal/util/shutdown";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import { cancelableGoal } from "../../../../../api-helper/listener/cancelGoals";
import { SdmGoalEvent } from "../../../../../api/goal/SdmGoalEvent";
import { SoftwareDeliveryMachineConfiguration } from "../../../../../api/machine/SoftwareDeliveryMachineOptions";
import { OnSpecificCanceledSdmGoal } from "../../../../../typings/types";
import { verifyGoal } from "../../../../signing/goalSigning";

@EventHandler("Cancel the currently executing goal",
    () => subscription({
        name: "OnSpecificCanceledSdmGoal",
        variables: {
            goalSetId: process.env.ATOMIST_GOAL_SET_ID || "n/a",
            uniqueName: process.env.ATOMIST_GOAL_UNIQUE_NAME || "n/a",
        },
    }))
export class CancelGoalOnCanceled implements HandleEvent<OnSpecificCanceledSdmGoal.Subscription> {

    @Value("") // empty path returns the entire configuration
    public configuration: SoftwareDeliveryMachineConfiguration;

    public async handle(e: EventFired<OnSpecificCanceledSdmGoal.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {

        const sdmGoal = e.data.SdmGoal[0] as SdmGoalEvent;

        if (!(await cancelableGoal(sdmGoal, this.configuration))) {
            logger.info("Not exciting this process because goal can't be canceled");
            return Success;
        }

        await verifyGoal(sdmGoal, this.configuration.sdm.goalSigning, ctx);

        logger.info("Exiting this process because goal was canceled");

        // exit immediately with 0 to make sure k8s doesn't re-schedule this pod
        automationClientInstance().configuration.ws.termination.graceful = false;
        if (cluster.isWorker) {
            await (automationClientInstance().webSocketHandler as ClusterWorkerRequestProcessor).sendShutdown(0, ctx as any);
        }
        safeExit(0);

        return Success;
    }
}
