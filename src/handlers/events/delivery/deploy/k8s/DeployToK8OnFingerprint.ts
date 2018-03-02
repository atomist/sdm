/**
 * Deploy a published artifact identified in an ImageLinked event.
 */

import {
    EventFired,
    EventHandler,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets, success,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {createStatus} from "../../../../../util/github/ghub";
import {TargetInfo} from "../Deployment";
import {OnDeployToProductionFingerprint} from "../../../../../typings/types";
import {BuildContext} from "../../../../../common/phases/gitHubContext";
import {K8AutomationDeployContext} from "./RequestDeployOnSuccessStatus";
import {
    currentPhaseIsStillPending,
    GitHubStatusAndFriends, nothingFailed, Phases, PlannedPhase,
    previousPhaseSucceeded
} from "../../../../../common/phases/Phases";
import {promotedEnvironment} from "../../../../../software-delivery-machine/K8sSoftwareDeliveryMachine";

// TODO could make more common with other deployer...
@EventHandler("Deploy linked artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnDeployToProductionFingerprint.graphql"))
export class DeployToK8OnFingerprint<T extends TargetInfo> implements HandleEvent<OnDeployToProductionFingerprint.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private phases: Phases,
                private ourPhase: PlannedPhase) {
    }

    public async handle(event: EventFired<OnDeployToProductionFingerprint.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const fingerprint = event.data.Fingerprint[0];
        const commit = fingerprint.commit;

        // TODO doesn't work as built status isn't in, yet
        // const builtStatus = commit.statuses.find(status => status.context === BuildContext);
        // if (!builtStatus) {
        //     console.log(`Deploy: builtStatus not found`);
        //     return Promise.resolve(Success);
        // }
        const statusAndFriends: GitHubStatusAndFriends = {
            context: BuildContext,
            state: "success", // builtStatus.state,
            description: "This is sadly hardcoded",
            targetUrl: "xxx",
            siblings: fingerprint.commit.statuses,
        };
        const status = statusAndFriends;

        if (nothingFailed(statusAndFriends) && !previousPhaseSucceeded(params.phases, params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        logger.info(`Requesting deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: K8AutomationDeployContext + promotedEnvironment.name,
            state: "pending",
            description: "Requested deploy by k8-automation",
        });
        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: params.ourPhase.context,
            description: "Working on " + params.ourPhase.name,
            state: "pending",
        });
        return Success;


    }
}
