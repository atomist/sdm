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

import { sprintf } from "sprintf-js";
import { fetchGoalsForCommit } from "../../api-helper/goal/fetchGoalsOnCommit";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { Goal } from "../../api/goal/Goal";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import {
    EndpointVerificationInvocation,
    EndpointVerificationListener,
} from "../../api/listener/EndpointVerificationListener";
import { SdmGoalState } from "../../typings/types";

/**
 * What the SDM should define for each environment's verification
 */
export interface SdmVerification {
    verifiers: EndpointVerificationListener[];
    endpointGoal: Goal;
    requestApproval: boolean;
}

export function executeVerifyEndpoint(sdm: SdmVerification): ExecuteGoal {
    return async (r: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { context, id, goalEvent } = r;
        const sdmGoals = await fetchGoalsForCommit(context, id, goalEvent.repo.providerId);
        const endpointGoal = sdmGoals.find(sg => sg.externalKey === sdm.endpointGoal.context);

        if (!endpointGoal) {
            r.progressLog.write(sprintf("Did not find endpoint goal. Looking for context %s", sdm.endpointGoal.context));
            throw new Error("Endpoint goal unfound");
        }
        if (!endpointGoal.url) {
            r.progressLog.write(sprintf("Did not find endpoint url: %j", endpointGoal));
            throw new Error("Endpoint goal has no URL");

        }
        const inv: EndpointVerificationInvocation = {
            id: r.id,
            url: endpointGoal.url,
            addressChannels: r.addressChannels,
            preferences: r.preferences,
            context: r.context,
            credentials: r.credentials,
        };
        await Promise.all(sdm.verifiers.map(verifier => verifier(inv).catch(err => {
            r.progressLog.write("A verifier threw: " + err.message);
            r.progressLog.write("stack: " + err.stack);
            throw err;
        })));

        return {
            code: 0,
            state: sdm.requestApproval ? SdmGoalState.waiting_for_approval : undefined,
            targetUrl: endpointGoal.url,
        };
    };
}
