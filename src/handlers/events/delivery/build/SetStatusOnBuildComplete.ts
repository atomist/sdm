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

import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import axios from "axios";
import * as stringify from "json-stringify-safe";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { descriptionFromState, updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { findSdmGoalOnCommit } from "../../../../common/delivery/goals/support/fetchGoalsOnCommit";
import { AddressChannels, addressChannelsFor } from "../../../../common/slack/addressChannels";
import { SdmGoal, SdmGoalState } from "../../../../ingesters/sdmGoalIngester";
import { LogInterpretation } from "../../../../spi/log/InterpretedLog";
import { BuildStatus, OnBuildComplete } from "../../../../typings/types";
import { reportFailureInterpretationToLinkedChannels } from "../../../../util/slack/reportFailureInterpretationToLinkedChannels";

/**
 * Set build status on complete build
 */
@EventHandler("Set build goal to successful on build complete, if it's side-effecting", subscription("OnBuildComplete"))
export class SetGoalOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    constructor(private readonly buildGoals: [Goal],
                private readonly logInterpretation?: LogInterpretation) {
    }

    public async handle(event: EventFired<OnBuildComplete.Subscription>,
                        ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit: OnBuildComplete.Commit = build.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        params.buildGoals.forEach(async buildGoal => {
            const sdmGoal = await findSdmGoalOnCommit(ctx, id, commit.repo.org.provider.providerId, buildGoal);
            if (!sdmGoal) {
                logger.debug("No build goal on commit; ignoring someone else's build result");
                return Success;
            }
            if (sdmGoal.fulfillment.method !== "side-effect" && sdmGoal.fulfillment.method !== "other") {
                logger.info("This build goal is not set up to be completed based on the build node. %j",
                    sdmGoal.fulfillment);
                return Success;
            }
            logger.info("Updating build goal: %s", buildGoal.context);
            await setBuiltContext(ctx, buildGoal, sdmGoal,
                build.status,
                build.buildUrl);
        });
        if (build.status === "failed" && build.buildUrl) {
            const ac = addressChannelsFor(commit.repo, ctx);
            await displayBuildLogFailure(id, build, ac, params.logInterpretation);
        }
        return Success;
    }
}

export async function displayBuildLogFailure(id: RemoteRepoRef,
                                             build: { buildUrl?: string, status?: string },
                                             addressChannels: AddressChannels,
                                             logInterpretation: LogInterpretation) {
    const buildUrl = build.buildUrl;
    if (buildUrl) {
        logger.info("Retrieving failed build log from " + buildUrl);
        const buildLog = (await axios.get(buildUrl)).data;
        logger.debug("Do we have a log interpretation? " + !!logInterpretation);
        const interpretation = logInterpretation && logInterpretation.logInterpreter(buildLog);
        logger.debug("What did it say? " + stringify(interpretation));
        // The deployer might have information about the failure; report it in the channels
        if (interpretation) {
            await reportFailureInterpretationToLinkedChannels("build", interpretation,
                {log: buildLog, url: buildUrl}, id, addressChannels);
        } else {
            await addressChannels({
                content: buildLog,
                fileType: "text",
                fileName: `build-${build.status}-${id.sha}.log`,
            } as any);
        }
    } else {
        return addressChannels("No build log detected for " + linkToSha(id));
    }
}

function linkToSha(id: RemoteRepoRef) {
    return slack.url(id.url + "/tree/" + id.sha, id.sha.substr(0, 6));
}

function buildStatusToSdmGoalState(buildStatus: BuildStatus): SdmGoalState {
    switch (buildStatus) {
        case "passed" :
            return "success";
        case "broken":
        case "failed":
        case "canceled" :
            return "failure";
        default:
            return "in_process"; // in_process
    }
}

async function setBuiltContext(ctx: HandlerContext,
                               goal: Goal,
                               sdmGoal: SdmGoal,
                               state: BuildStatus,
                               url: string): Promise<any> {
    const newState = buildStatusToSdmGoalState(state);
    return updateGoal(ctx, sdmGoal,
        {
            url,
            state: newState,
            description: descriptionFromState(goal, newState),
        });
}
