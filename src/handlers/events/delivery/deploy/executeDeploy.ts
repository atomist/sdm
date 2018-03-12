import { failure, HandleCommand, HandlerContext, logger, Success } from "@atomist/automation-client";
import { HandlerResult } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Goal } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { RetryDeployParameters } from "../../../commands/RetryDeploy";
import { deploy } from "./deploy";
import { ExecuteGoalInvocation } from "./ExecuteGoalOnSuccessStatus";

export interface DeploySpec<T extends TargetInfo> {
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore: ArtifactStore;
    deployer: Deployer<T>;
    targeter: (id: RemoteRepoRef) => T;
}

export function executeDeploy<T extends TargetInfo>(spec: DeploySpec<T>) {
    return async (status: OnAnySuccessStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;
        const image = status.commit.image;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const deployName = params.implementationName;

        if (!image) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return failure(new Error("No image linked"));
        }

        logger.info(`Running deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        const retryButton = buttonForCommand({text: "Retry"}, retryCommandNameFor(deployName), {
            repo: commit.repo.name,
            owner: commit.repo.owner,
            sha: commit.sha,
            targetUrl: image.imageName,
        });

        await dedup(commit.sha, () =>
            deploy({
                ...spec,
                id,
                githubToken: params.githubToken,
                targetUrl: image.imageName,
                ac: addressChannelsFor(commit.repo, ctx),
                team: ctx.teamId,
                retryButton,
                logFactory: createEphemeralProgressLog,
            }));

        return Success;
    };
}

function retryCommandNameFor(deployName: string) {
    return "Retry" + deployName;
}

export function retryDeployFromLocal<T extends TargetInfo>(deployName: string,
                                                           spec: DeploySpec<T>): HandleCommand {
    return commandHandlerFrom((ctx: HandlerContext, commandParams: RetryDeployParameters) => {
        return deploy({
            deployGoal: spec.deployGoal,
            endpointGoal: spec.endpointGoal,
            id: new GitHubRepoRef(commandParams.owner, commandParams.repo, commandParams.sha),
            githubToken: commandParams.githubToken,
            targetUrl: commandParams.targetUrl,
            artifactStore: spec.artifactStore,
            deployer: spec.deployer,
            targeter: spec.targeter,
            ac: (msg, opts) => ctx.messageClient.respond(msg, opts),
            team: ctx.teamId,
            retryButton: buttonForCommand({text: "Retry"}, retryCommandNameFor(deployName), {
                ...commandParams,
            }),
            logFactory: createEphemeralProgressLog,
        });
    }, RetryDeployParameters, retryCommandNameFor(deployName));
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
