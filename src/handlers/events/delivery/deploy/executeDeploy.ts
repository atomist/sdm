import { failure, HandlerContext, HandlerResult, logger, success, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { ListenerInvocation } from "../../../../";
import { Goal } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { ConsoleProgressLog, InMemoryProgressLog, MultiProgressLog } from "../../../../common/log/progressLogs";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { AddressChannels } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { ArtifactDeployer } from "../../../../spi/deploy/ArtifactDeployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { SourceDeployer } from "../../../../spi/deploy/SourceDeployer";
import { LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { retryCommandNameFor } from "../../../commands/RetryGoal";
import { ExecuteGoalInvocation, ExecuteGoalResult, Executor, StatusForExecuteGoal } from "../ExecuteGoalOnSuccessStatus";
import { deploy, DeployArtifactParams, deploySource, DeploySourceParams, Targeter } from "./deploy";

export interface ArtifactDeploySpec<T extends TargetInfo> {
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore: ArtifactStore;
    deployer: ArtifactDeployer<T>;
    targeter: Targeter<T>;
}

export function runWithLog<T extends TargetInfo>(whatToRun: (RunWithLogInvocation) => Promise<ExecuteGoalResult>,
                                                 logInterpreter?: LogInterpreter): Executor {
    return async (status: OnAnySuccessStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;

        const log = await createEphemeralProgressLog();
        const progressLog = new MultiProgressLog(ConsoleProgressLog, new InMemoryProgressLog(), log);
        const addressChannels = addressChannelsFor(commit.repo, ctx);
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        const reportError = howToReportError(params, addressChannels, progressLog, id, logInterpreter);

        await whatToRun({status, progressLog, reportError, context: ctx, addressChannels, id, credentials});

        await progressLog.close();
        return Promise.resolve(Success as ExecuteGoalResult);
    };
}

export interface RunWithLogInvocation extends ListenerInvocation {
    status: StatusForExecuteGoal.Status;
    progressLog: ProgressLog;
    reportError: (Error) => Promise<ExecuteGoalResult>;
}

export function deployArtifactWithLogs<T extends TargetInfo>(spec: ArtifactDeploySpec<T>) {
    return runWithLog(executeDeployArtifact(spec), spec.deployer.logInterpreter);
}

export type ExecuteWithLog = (rwli: RunWithLogInvocation) => Promise<ExecuteGoalResult>;

export function executeDeployArtifact<T extends TargetInfo>(spec: ArtifactDeploySpec<T>): ExecuteWithLog {
    return async (rwli: RunWithLogInvocation) => {
        const commit = rwli.status.commit;
        const image = rwli.status.commit.image;
        const pushBranch = commit.pushes[0].branch;
        rwli.progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);
        const deployParams: DeployArtifactParams<T> = {
            ...spec,
            credentials: rwli.credentials,
            addressChannels: rwli.addressChannels,
            id: rwli.id as GitHubRepoRef,
            targetUrl: image.imageName,
            team: rwli.context.teamId,
            progressLog: rwli.progressLog,
            branch: pushBranch,
        };

        if (!image && !spec.artifactStore.imageUrlIsOptional) {
            rwli.progressLog.write(`No image found on commit ${commit.sha}; can't deploy`);
            return rwli.reportError(new Error("No image linked"));
        } else {
            logger.info(`Running deploy. Triggered by ${rwli.status.state} status: ${rwli.status.context}: ${rwli.status.description}`);
            return dedup(commit.sha, () =>
                deploy(deployParams)
                    .catch(err => rwli.reportError(err)))
                .then(success);
        }
    };
}

export interface SourceDeploySpec {
    deployGoal: Goal;
    endpointGoal: Goal;
    deployer: SourceDeployer;
}

export function executeDeploySource(spec: SourceDeploySpec): ((rwli: RunWithLogInvocation) => Promise<ExecuteGoalResult>) {
    return async (rwli: RunWithLogInvocation) => {
        const commit = rwli.status.commit;
        const pushBranch = commit.pushes[0].branch;
        rwli.progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);
        const deployParams: DeploySourceParams = {
            ...spec,
            credentials: rwli.credentials,
            addressChannels: rwli.addressChannels,
            id: rwli.id as GitHubRepoRef,
            team: rwli.context.teamId,
            progressLog: rwli.progressLog,
            branch: pushBranch,
        };

        logger.info(`Running deploy. Triggered by ${rwli.status.state} status: ${rwli.status.context}: ${rwli.status.description}`);
        return dedup(commit.sha, () =>
            deploySource(deployParams)
                .catch(err => rwli.reportError(err)))
            .then(success);
    };
}

function howToReportError(executeGoalInvocation: ExecuteGoalInvocation,
                          addressChannels: AddressChannels,
                          progressLog: ProgressLog,
                          id: GitHubRepoRef,
                          logInterpreter?: LogInterpreter) {
    return async (err: Error) => {
        logger.error(err.message);
        logger.error(err.stack);

        const retryButton = buttonForCommand({text: "Retry"},
            retryCommandNameFor(executeGoalInvocation.implementationName), {
                repo: id.repo,
                owner: id.owner,
                sha: id.sha,
            });

        const interpretation = logInterpreter && !!progressLog.log && logInterpreter(progressLog.log);
        // The deployer might have information about the failure; report it in the channels
        if (interpretation) {
            await reportFailureInterpretation("deploy", interpretation,
                {url: progressLog.url, log: progressLog.log},
                id, addressChannels, retryButton);
        } else {
            await addressChannels(":x: Failure deploying: " + err.message);
        }
        return createStatus(executeGoalInvocation.githubToken, id, {
            state: "failure",
            target_url: progressLog.url,
            context: executeGoalInvocation.goal.context,
            description: executeGoalInvocation.goal.failedDescription,
        }).then(no => ({code: 0, message: err.message}));
    };
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
