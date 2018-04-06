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

import { EventFired, HandleEvent, HandlerContext, HandlerResult, logger, Secrets, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import * as stringify from "json-stringify-safe";
import { runWithLog } from "../../../common/delivery/deploy/runWithLog";
import { sdmGoalStateToGitHubStatusState } from "../../../common/delivery/goals/CopyGoalToGitHubStatus";
import { fetchCommitForSdmGoal } from "../../../common/delivery/goals/fetchGoalsOnCommit";
import { ExecuteGoalInvocation } from "../../../common/delivery/goals/goalExecution";
import { SdmGoalImplementationMapper } from "../../../common/delivery/goals/SdmGoalImplementationMapper";
import { SdmGoal, SdmGoalState } from "../../../ingesters/sdmGoalIngester";
import {
    CommitForSdmGoal, OnAnyRequestedSdmGoal, OnRequestedSdmGoal, SdmGoalFields, SdmGoalRepo,
    StatusForExecuteGoal,
} from "../../../typings/types";
import { executeGoal } from "./verify/executeGoal";

export class FulfillGoalOnRequested implements HandleEvent<OnAnyRequestedSdmGoal.Subscription>,
    EventHandlerMetadata {

    public subscriptionName: string;
    public subscription: string;
    public name: string;
    public description: string;
    public secrets = [{name: "githubToken", uri: Secrets.OrgToken}];

    public githubToken: string;

    constructor(private implementationMapper: SdmGoalImplementationMapper) {
        const implementationName = "FulfillGoal";
        this.subscriptionName = "OnAnyRequestedSdmGoal";
        this.subscription =
            subscription({name: "OnAnyRequestedSdmGoal"});
        this.name = implementationName + "OnAnyRequestedSdmGoal";
        this.description = `Fulfill a goal when it reaches 'requested' state`;
    }

    public async handle(event: EventFired<OnAnyRequestedSdmGoal.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {

        const sdmGoal = event.data.SdmGoal[0] as SdmGoal;
        const commit = await fetchCommitForSdmGoal(ctx, sdmGoal);

        const status: StatusForExecuteGoal.Fragment = convertForNow(sdmGoal, commit);

        // this should not happen but it does: automation-api#395
        if (sdmGoal.state !== "requested") {
            logger.warn(`Received '${sdmGoal.state}' on ${status.context}, while looking for 'requested'`);
            return Success;
        }

        if (sdmGoal.fulfillment.method !== "SDM fulfill on requested") {
            logger.info("Implementation method is " + sdmGoal.fulfillment.method + "; not fulfilling");
            return Success;
        }

        logger.info("Really executing FulfillGoalOnRequested with " + sdmGoal.fulfillment.name); // take this out when automation-api#395 is fixed

        // bug: automation-api#392
        params.githubToken = process.env.GITHUB_TOKEN;

        const { goal, goalExecutor, logInterpreter } = this.implementationMapper.findImplementationBySdmGoal(sdmGoal);

        const inv: ExecuteGoalInvocation = {
            implementationName: sdmGoal.fulfillment.name,
            githubToken: params.githubToken,
            goal,
        };

        return executeGoal(runWithLog(goalExecutor, logInterpreter), status, ctx, inv, sdmGoal);
    }
}

function convertForNow(sdmGoal: SdmGoalFields.Fragment, commit: CommitForSdmGoal.Commit): StatusForExecuteGoal.Fragment {
    return {
        commit,
        state: sdmGoalStateToGitHubStatusState(sdmGoal.state as SdmGoalState),
        targetUrl: sdmGoal.url, // not handling approval weirdness
        context: sdmGoal.externalKey,
        description: sdmGoal.description,
    };
}
