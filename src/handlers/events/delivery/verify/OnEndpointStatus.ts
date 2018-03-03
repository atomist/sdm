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
    GraphQL, HandleCommand, HandlerResult, logger, MappedParameter, MappedParameters, Parameter, Secret, Secrets, success,
    Success,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { addressSlackChannels, buttonForCommand, Destination } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { AddressChannels, addressDestination, messageDestinations } from "../../../../";
import { ListenerInvocation, SdmListener } from "../../../../common/listener/Listener";
import { splitContext } from "../../../../common/phases/gitHubContext";
import { currentPhaseIsStillPending, GitHubStatusAndFriends, PlannedPhase, previousPhaseSucceeded } from "../../../../common/phases/Phases";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { OnSuccessStatus, StatusState } from "../../../../typings/types";
import { createStatus, tipOfDefaultBranch } from "../../../../util/github/ghub";
import {
    HttpServicePhases,
    StagingEndpointContext,
} from "../phases/httpServicePhases";
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
@EventHandler("React to an endpoint",
    GraphQL.subscriptionFromFile("graphql/subscription/OnSuccessStatus.graphql", undefined,
        {
            context: StagingEndpointContext,
        }))
export class OnEndpointStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private sdm: SdmVerification) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            description: status.description,
            state: status.state,
            targetUrl: status.targetUrl,
            siblings: status.commit.statuses,
        };

        if (!previousPhaseSucceeded(HttpServicePhases, params.sdm.verifyPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.sdm.verifyPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

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
    verifyPhase: PlannedPhase;
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
                sdm.verifyPhase),
            err => {
                // todo: report error in Slack? ... or load it to a log that links
                logger.warn("Failing verification because: " + err);
                return setVerificationStatus(li.credentials, li.id,
                    "failure",
                    false,
                    targetUrl,
                    sdm.verifyPhase)
                    .then(() => reportFailedVerification(addressChannels,
                        sdm.verifyPhase, li.id, targetUrl, err.message));
            })
        .then(success);
}

function reportFailedVerification(ac: AddressChannels, verifyPhase: PlannedPhase, id: RemoteRepoRef,
                                  targetUrl: string, message: string) {
    return ac(failedVerificationMessage(verifyPhase, id, targetUrl, message));
}

function failedVerificationMessage(verifyPhase: PlannedPhase, id: RemoteRepoRef,
                                   targetUrl: string, message: string): slack.SlackMessage {

    const attachment: slack.Attachment = {
        fallback: "verification failure report",
        title: "Verification failed",
        text: `Failed to verify ${linkToSha(id)} at ${targetUrl}:\n> ${message}`,
        actions: [retryButton(verifyPhase, id, targetUrl)],
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

function retryButton(verifyPhase: PlannedPhase, id: RemoteRepoRef, targetUrl: string): slack.Action {
    return buttonForCommand({text: "Retry"},
        retryVerificationCommandName(verifyPhase), {
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
                               verifyPhase: PlannedPhase): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id as GitHubRepoRef, {
        state,
        target_url: requestApproval ? forApproval(targetUrl) : targetUrl,
        context: verifyPhase.context,
        description: state === "success" ? verifyPhase.completedDescription : ("Failed to " + verifyPhase.name),
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

function retryVerificationCommandName(verifyPhase: PlannedPhase) {
    // todo: get the env on the PlannedPhase
    return "RetryFailedVerification" + splitContext(verifyPhase.context).env;
}

export function retryVerifyCommand(sdm: SdmVerification): HandleCommand<RetryVerifyParameters> {
    return commandHandlerFrom(verifyHandle(sdm), RetryVerifyParameters,
        retryVerificationCommandName(sdm.verifyPhase),
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
