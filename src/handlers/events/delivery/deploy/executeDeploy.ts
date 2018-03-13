import {
    failure, HandleCommand, HandlerContext, logger, MappedParameter, MappedParameters, Parameter, Secret, Secrets,
    Success
} from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Goal } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { RetryDeployParameters } from "../../../commands/RetryDeploy";
import { deploy, Targeter } from "./deploy";
import { ExecuteGoalInvocation, ExecuteGoalResult, Executor } from "./ExecuteGoalOnSuccessStatus";
import { Parameters } from "@atomist/automation-client/decorators";
import { createStatus, tipOfDefaultBranch } from "../../../../util/github/ghub";

export interface DeploySpec<T extends TargetInfo> {
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore: ArtifactStore;
    deployer: Deployer<T>;
    targeter: Targeter<T>;
}

export function executeDeploy<T extends TargetInfo>(spec: DeploySpec<T>): Executor {
    return async (status: OnAnySuccessStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;
        const image = status.commit.image;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const deployName = params.implementationName;

        if (!image && !spec.artifactStore.imageUrlIsOptional) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return failure(new Error("No image linked"));
        }

        logger.info(`Running deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        const pushBranch = commit.pushes[0].branch;
        logger.info(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);
        const retryButton = buttonForCommand({text: "Retry"}, retryCommandNameFor(deployName), {
            repo: commit.repo.name,
            owner: commit.repo.owner,
            sha: commit.sha,
            targetUrl: image.imageName,
            branch: pushBranch,
        });

        await dedup(commit.sha, () =>
            deploy({
                ...spec,
                id,
                githubToken: params.githubToken,
                targetUrl: image ? image.imageName: undefined,
                ac: addressChannelsFor(commit.repo, ctx),
                team: ctx.teamId,
                retryButton,
                logFactory: createEphemeralProgressLog,
                branch: pushBranch,
            }));

        return Promise.resolve(Success as ExecuteGoalResult);
    };
}

function retryCommandNameFor(deployName: string) {
    return "Retry" + deployName;
}

@Parameters()
export class RetryGoalParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    // I think I should be using `target` somehow? because we need provider too
    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @Parameter({ required: false })
    public sha: string;
}

export function retryGoal(implementationName: string, goal: Goal): HandleCommand {
    return commandHandlerFrom(async (ctx: HandlerContext, commandParams: RetryGoalParameters) => {
        const sha = commandParams.sha || await tipOfDefaultBranch(commandParams.githubToken, new GitHubRepoRef(commandParams.owner, commandParams.repo));
        const id = new GitHubRepoRef(commandParams.owner, commandParams.repo, sha);
        await createStatus(commandParams.githubToken, id, {
            context: goal.context,
            state: "pending",
            description: goal.requestedDescription
        });
    }, RetryGoalParameters, retryCommandNameFor(implementationName), "Retry an execution of " + goal.name, goal.retryIntent)
}

const running = {};

async function dedup<T>(key: string, f: () => Promise<T>): Promise<T | void> {
    if (running[key]) {
        logger.warn("deploy was called twice for " + key);
        return Promise.resolve();
    }
    running[key] = true;
    const promise = f().then(t => {
        running[key] = undefined;
        return t;
    });
    return promise;
}
