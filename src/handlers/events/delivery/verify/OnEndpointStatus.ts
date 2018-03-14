/*
 * Copyright © 2017 Atomist, Inc.
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
    failure,
    GraphQL,
    HandleCommand,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    success,
    Success,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { addressSlackChannels, buttonForCommand, Destination } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { GitHubStatusAndFriends, splitContext } from "../../../../common/goals/gitHubContext";
import { currentGoalIsStillPending, Goal } from "../../../../common/goals/Goal";
import { ListenerInvocation, SdmListener } from "../../../../common/listener/Listener";
import { AddressChannels, addressDestination, messageDestinations } from "../../../../common/slack/addressChannels";
import { OnSuccessStatus, StatusState } from "../../../../typings/types";
import { createStatus, tipOfDefaultBranch } from "../../../../util/github/ghub";
import { StagingEndpointContext } from "../goals/httpServiceGoals";
import { forApproval } from "./approvalGate";

export interface EndpointVerificationInvocation extends ListenerInvocation {

    /**
     * Reported endpoint base url
     */
    url: string;
}

export type EndpointVerificationListener = SdmListener<EndpointVerificationInvocation>;

/**
 * React to an endpoint reported in a GitHub status.
 */
@EventHandler("React to an endpoint", GraphQL.subscriptionFromFile(
    "../../../../graphql/subscription/OnSuccessStatus",
    __dirname,
    {
        context: StagingEndpointContext,
    }),
)
export class OnEndpointStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(public goal: Goal, private sdm: SdmVerification) {
    }

    public async handle(event: EventFired<OnSuccessStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            description: status.description,
            state: status.state,
            targetUrl: status.targetUrl,
            siblings: status.commit.statuses,
        };

        const preconsStatus = await params.goal.preconditionsStatus({token: params.githubToken}, id, statusAndFriends);
        if (preconsStatus === "failure") {
            logger.info("Preconditions failed for goal %s on %j", params.goal.name, id);
            return failure(new Error("Precondition error"));
        }
        if (preconsStatus === "waiting") {
            logger.info("Preconditions not yet met for goal %s on %j", params.goal.name, id);
            return Success;
        }
        if (!currentGoalIsStillPending(params.sdm.verifyGoal.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        return verifyImpl(params.sdm,
            {
                context, id, messageDestination: messageDestinations(commit.repo, context),
                credentials: {token: params.githubToken},
            },
            status.targetUrl);
    }
}

/**
 * What the SDM should define for each environment's verification
 */
export interface SdmVerification {
    verifiers: EndpointVerificationListener[];
    verifyGoal: Goal;
    requestApproval: boolean;
}

/**
 *
 * id: RemoteRepoRef; messageDestination: Destination}} specific to the invocation; common to Listeners
 * @param sdm
 * @param li common listener-invocation stuff
 * @param {string} targetUrl
 * @returns {Promise<HandlerResult>}
 */
function verifyImpl(sdm: SdmVerification,
                    li: {
                        context: HandlerContext,
                        credentials: ProjectOperationCredentials,
                        id: RemoteRepoRef,
                        messageDestination: Destination,
                    },
                    targetUrl: string) {
    const addressChannels = addressDestination(li.messageDestination, li.context);
    const i: EndpointVerificationInvocation = {
        id: li.id,
        url: targetUrl,
        addressChannels,
        context: li.context,
        credentials: li.credentials,
    };

    return Promise.all(sdm.verifiers.map(verifier => verifier(i)))
        .then(
            () => setVerificationStatus(li.credentials,
                li.id,
                "success",
                sdm.requestApproval,
                targetUrl,
                sdm.verifyGoal),
            err => {
                // todo: report error in Slack? ... or load it to a log that links
                logger.warn("Failing verification because: " + err);
                return setVerificationStatus(li.credentials, li.id,
                    "failure",
                    false,
                    targetUrl,
                    sdm.verifyGoal)
                    .then(() => reportFailedVerification(addressChannels,
                        sdm.verifyGoal, li.id, targetUrl, err.message));
            })
        .then(success);
}

function reportFailedVerification(ac: AddressChannels, goal: Goal, id: RemoteRepoRef,
                                  targetUrl: string, message: string) {
    return ac(failedVerificationMessage(goal, id, targetUrl, message));
}

function failedVerificationMessage(goal: Goal, id: RemoteRepoRef,
                                   targetUrl: string, message: string): slack.SlackMessage {

    const attachment: slack.Attachment = {
        fallback: "verification failure report",
        title: "Verification failed",
        text: `Failed to verify ${linkToSha(id)} at ${targetUrl}:\n> ${message}`,
        actions: [retryButton(goal, id, targetUrl)],
        color: "#D94649",
    };

    return {
        attachments: [attachment],
    };
}

function linkToSha(id: RemoteRepoRef) {
    return slack.url(id.url + "/tree/" + id.sha,
        `${id.owner}/${id.repo}#${id.sha.substr(0, 6)}`);
}

function retryButton(goal: Goal, id: RemoteRepoRef, targetUrl: string): slack.Action {
    return buttonForCommand({text: "Retry"},
        retryVerificationCommandName(goal), {
            repo: id.repo,
            owner: id.owner,
            sha: id.sha,
            targetUrl,
        });
}

function setVerificationStatus(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef, state: StatusState,
                               requestApproval: boolean,
                               targetUrl: string,
                               verifyGoal: Goal): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id as GitHubRepoRef, {
        state,
        target_url: requestApproval ? forApproval(targetUrl) : targetUrl,
        context: verifyGoal.context,
        description: state === "success" ? verifyGoal.completedDescription : ("Failed to " + verifyGoal.name),
    });
}

@Parameters()
export class RetryVerifyParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.SlackChannelName)
    public channelName: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @Parameter({required: false})
    public sha: string;

    @Parameter()
    public targetUrl: string;

}

function retryVerificationCommandName(verifyGoal: Goal) {
    // todo: get the env on the Goal
    return "RetryFailedVerification" + splitContext(verifyGoal.context).env;
}

export function retryVerifyCommand(sdm: SdmVerification): HandleCommand<RetryVerifyParameters> {
    return commandHandlerFrom(verifyHandle(sdm), RetryVerifyParameters,
        retryVerificationCommandName(sdm.verifyGoal),
        "retry verification", "retry verification",
    );
}

function verifyHandle(sdm: SdmVerification) {
    return async (ctx: HandlerContext, params: RetryVerifyParameters) => {
        const sha = params.sha || await
            tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo));
        const id = new GitHubRepoRef(params.owner, params.repo, sha);
        // todo: get all destinations instead of only one channel; update messages
        const messageDestination = addressSlackChannels(ctx.teamId, params.channelName);
        return verifyImpl(sdm,
            {id, messageDestination, credentials: {token: params.githubToken}, context: ctx},
            params.targetUrl);
    };
}
