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

import { EventFired, HandleEvent, HandlerContext, HandlerResult, logger, Success, } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { EventHandlerMetadata, ValueDeclaration, } from "@atomist/automation-client/metadata/automationMetadata";
import { RepoRefResolver } from "../../../../api/command/editor/support/RepoRefResolver";
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import { RunWithLogContext } from "../../../../api/goal/ExecuteGoalWithLog";
import { SdmGoalImplementationMapper } from "../../../../api/goal/support/SdmGoalImplementationMapper";
import { SdmGoal, SdmGoalState, } from "../../../../ingesters/sdmGoalIngester";
import { fetchCommitForSdmGoal } from "../../../../internal/delivery/goals/support/fetchGoalsOnCommit";
import { sdmGoalStateToGitHubStatusState } from "../../../../internal/delivery/goals/support/github/gitHubStatusSetters";
import { LoggingProgressLog } from "../../../../log/LoggingProgressLog";
import { WriteToAllProgressLog } from "../../../../log/WriteToAllProgressLog";
import { ProgressLogFactory } from "../../../../spi/log/ProgressLog";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";
import { CommitForSdmGoal, OnAnyRequestedSdmGoal, SdmGoalFields, StatusForExecuteGoal, } from "../../../../typings/types";
import { fetchProvider } from "../../../../util/github/gitHubProvider";
import { executeGoal } from "./executeGoal";

/**
 * Handle an SDM request goal. Used for many implementation types.
 */
export class FulfillGoalOnRequested implements HandleEvent<OnAnyRequestedSdmGoal.Subscription>,
    EventHandlerMetadata {

    public subscriptionName: string;
    public subscription: string;
    public name: string;
    public description: string;
    // public secrets = [{name: "githubToken", uri: Secrets.OrgToken}];
    public values = [{ path: "token", name: "githubToken", required: true }] as any[] as ValueDeclaration[];

    public githubToken: string;

    constructor(private readonly implementationMapper: SdmGoalImplementationMapper,
                private readonly projectLoader: ProjectLoader,
                private readonly repoRefResolver: RepoRefResolver,
                private readonly logFactory: ProgressLogFactory) {
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
            logger.warn(`Goal ${sdmGoal.name}: Received '${sdmGoal.state}' on ${status.context}, while looking for 'requested'`);
            return Success;
        }

        if (sdmGoal.fulfillment.method !== "SDM fulfill on requested") {
            logger.info("Goal %s: Implementation method is '%s'; not fulfilling", sdmGoal.name, sdmGoal.fulfillment.method);
            return Success;
        }

        logger.info("Executing FulfillGoalOnRequested with '%s'", sdmGoal.fulfillment.name); // take this out when automation-api#395 is fixed

        const {goal, goalExecutor, logInterpreter} = this.implementationMapper.findImplementationBySdmGoal(sdmGoal);

        const log = await this.logFactory(ctx, sdmGoal);
        const progressLog = new WriteToAllProgressLog(sdmGoal.name, new LoggingProgressLog(sdmGoal.name, "debug"), log);
        const addressChannels = addressChannelsFor(commit.repo, ctx);
        const id = params.repoRefResolver.repoRefFromSdmGoal(sdmGoal, await fetchProvider(ctx, sdmGoal.repo.providerId));
        const credentials = {token: params.githubToken};
        const rwlc: RunWithLogContext = {status, progressLog, context: ctx, addressChannels, id, credentials};

        const isolatedGoalLauncher = this.implementationMapper.getIsolatedGoalLauncher();

        if (goal.definition.isolated && !process.env.ATOMIST_ISOLATED_GOAL && isolatedGoalLauncher) {
            return isolatedGoalLauncher(sdmGoal, ctx, progressLog);
        } else {
            delete (sdmGoal as any).id;
            return executeGoal({projectLoader: params.projectLoader},
                goalExecutor, rwlc, sdmGoal, goal, logInterpreter)
                .then(async res => {
                    await progressLog.close();
                    return res;
                }, async err => {
                    await progressLog.close();
                    throw err;
                });
        }
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
