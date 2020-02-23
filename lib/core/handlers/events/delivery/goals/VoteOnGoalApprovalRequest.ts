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
import { logger } from "@atomist/automation-client/lib/util/logger";
import { updateGoal } from "../../../../../api-helper/goal/storeGoals";
import { resolveCredentialsPromise } from "../../../../../api-helper/machine/handlerRegistrations";
import { addressChannelsFor } from "../../../../../api/context/addressChannels";
import { PreferenceStoreFactory } from "../../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../../api/context/skillContext";
import { SdmGoalEvent } from "../../../../../api/goal/SdmGoalEvent";
import { GoalImplementationMapper } from "../../../../../api/goal/support/GoalImplementationMapper";
import { SoftwareDeliveryMachineConfiguration } from "../../../../../api/machine/SoftwareDeliveryMachineOptions";
import {
    GoalApprovalRequestVote,
    GoalApprovalRequestVoteDecisionManager,
    GoalApprovalRequestVoter,
    GoalApprovalRequestVoterInvocation,
    UnanimousGoalApprovalRequestVoteDecisionManager,
} from "../../../../../api/registration/goalApprovalRequestVote";
import { CredentialsResolver } from "../../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../../spi/repo-ref/RepoRefResolver";
import {
    OnAnyApprovedSdmGoal,
    SdmGoalState,
} from "../../../../../typings/types";
import { shouldHandle } from "../../../../internal/delivery/goals/support/validateGoal";
import { verifyGoal } from "../../../../internal/signing/goalSigning";

/**
 * Vote on approved goals.
 *
 * This allows GoalApprovalVoter instances to vote on the approved goal to decide
 * if this approval request can be granted or not.
 *
 * The final decision if the request should be granted based on all votes is delegated to the
 * configured instance of GoalApprovalRequestVoteDecisionManager.
 */
@EventHandler("Vote on started or approved goals",
    () => subscription({
        name: "OnAnyApprovedSdmGoal",
        variables: { registration: () => [automationClientInstance()?.configuration?.name] },
    }))
export class VoteOnGoalApprovalRequest implements HandleEvent<OnAnyApprovedSdmGoal.Subscription> {

    @Value("")
    public configuration: SoftwareDeliveryMachineConfiguration;

    constructor(private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly voters: GoalApprovalRequestVoter[],
                private readonly decisionManager: GoalApprovalRequestVoteDecisionManager,
                private readonly implementationMapper: GoalImplementationMapper,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {
        if (this.voters.length === 0) {
            this.voters.push(async () => ({ vote: GoalApprovalRequestVote.Granted }));
        }
        if (!this.decisionManager) {
            this.decisionManager = UnanimousGoalApprovalRequestVoteDecisionManager;
        }
    }

    public async handle(event: EventFired<OnAnyApprovedSdmGoal.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const sdmGoal = event.data.SdmGoal[0] as SdmGoalEvent;

        if (!shouldHandle(sdmGoal)) {
            logger.debug(`Goal ${sdmGoal.name} skipped because not managed by this SDM`);
            return Success;
        }

        await verifyGoal(sdmGoal, this.configuration.sdm.goalSigning, context);

        const id = this.repoRefResolver.repoRefFromPush(sdmGoal.push);
        const credentials = await resolveCredentialsPromise(this.credentialsFactory.eventHandlerCredentials(context, id));
        const preferences = this.preferenceStoreFactory(context);

        const garvi: GoalApprovalRequestVoterInvocation = {
            id,
            context,
            credentials,
            addressChannels: addressChannelsFor(sdmGoal.push.repo, context),
            configuration: this.configuration,
            preferences,
            goal: sdmGoal,
            skill: createSkillContext(context),
        };

        const votes = await Promise.all(this.voters.map(v => v(garvi)));
        const decision = this.decisionManager(...votes);
        const goal = this.implementationMapper.findGoalBySdmGoal(sdmGoal);

        switch (decision) {
            case GoalApprovalRequestVote.Granted:
                if (sdmGoal.state === SdmGoalState.pre_approved) {
                    let g = sdmGoal;
                    const cbs = this.implementationMapper.findFulfillmentCallbackForGoal(sdmGoal);
                    for (const cb of cbs) {
                        g = await cb.callback(g, {
                            id,
                            addressChannels: undefined,
                            preferences,
                            credentials,
                            configuration: this.configuration,
                            context,
                            skill: createSkillContext(context),
                        });
                    }
                    await updateGoal(context, sdmGoal, {
                        state: SdmGoalState.requested,
                        description: !!sdmGoal.descriptions && !!sdmGoal.descriptions.requested
                            ? sdmGoal.descriptions.requested : goal.requestedDescription,
                        data: g.data,
                    });
                } else if (sdmGoal.state === SdmGoalState.approved) {
                    await updateGoal(context, sdmGoal, {
                        state: SdmGoalState.success,
                        description: !!sdmGoal.descriptions && !!sdmGoal.descriptions.completed
                            ? sdmGoal.descriptions.completed : goal.successDescription,
                    });
                }
                break;
            case GoalApprovalRequestVote.Denied:
                if (sdmGoal.state === SdmGoalState.pre_approved) {
                    const g: SdmGoalEvent = {
                        ...sdmGoal,
                        preApproval: undefined,
                    };
                    await updateGoal(context, g, {
                        state: SdmGoalState.waiting_for_pre_approval,
                        description: `${!!sdmGoal.descriptions && !!sdmGoal.descriptions.waitingForPreApproval ?
                            sdmGoal.descriptions.waitingForPreApproval : goal.waitingForPreApprovalDescription} \u00B7 start by @${sdmGoal.preApproval.userId} denied`,
                    });
                } else if (sdmGoal.state === SdmGoalState.approved) {
                    const g: SdmGoalEvent = {
                        ...sdmGoal,
                        approval: undefined,
                    };
                    await updateGoal(context, g, {
                        state: SdmGoalState.waiting_for_approval,
                        description: `${!!sdmGoal.descriptions && !!sdmGoal.descriptions.waitingForApproval ?
                            sdmGoal.descriptions.waitingForApproval : goal.waitingForApprovalDescription} \u00B7 approval by @${sdmGoal.approval.userId} denied`,
                    });
                }
                break;
            case GoalApprovalRequestVote.Abstain:
                // We don't do anything if vote isn't either granted or denied
                break;
        }

        return Success;
    }
}
