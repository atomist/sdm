import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Goal } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { ArtifactDeployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { deploy, DeployParams, Targeter } from "./deploy";
import { ExecuteGoalInvocation, ExecuteGoalResult, Executor } from "../ExecuteGoalOnSuccessStatus";
import { failure, HandlerContext, logger, Success } from "@atomist/automation-client";
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { createStatus } from "../../../../util/github/ghub";
import { LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { retryCommandNameFor } from "../../../commands/RetryGoal";
import { MultiProgressLog , ConsoleProgressLog, InMemoryProgressLog } from "../../../../common/log/progressLogs";
import { AddressChannels } from "../../../../common/slack/addressChannels";
import { ProgressLog } from "../../../../spi/log/ProgressLog";


export interface DeploySpec<T extends TargetInfo> {
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore: ArtifactStore;
    deployer: ArtifactDeployer<T>;
    targeter: Targeter<T>;
}

export function executeDeploy<T extends TargetInfo>(spec: DeploySpec<T>): Executor {
    return async (status: OnAnySuccessStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;
        const image = status.commit.image;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);


        const log = await createEphemeralProgressLog();
        const progressLog = new MultiProgressLog(ConsoleProgressLog, new InMemoryProgressLog(), log);
        const ac = addressChannelsFor(commit.repo, ctx);

        const errorReport = howToReportError(params, ac, progressLog, id, spec.deployer.logInterpreter);

        if (!image && !spec.artifactStore.imageUrlIsOptional) {
            progressLog.write(`No image found on commit ${commit.sha}; can't deploy`);
            await errorReport(new Error("No image linked"));
        } else {
            logger.info(`Running deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
            const pushBranch = commit.pushes[0].branch;
            logger.info(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);


            await dedup(commit.sha, async () => {
                const deployParams: DeployParams<T> = {
                    ...spec,
                    id,
                    githubToken: params.githubToken,
                    targetUrl: image ? image.imageName : undefined,
                    ac,
                    team: ctx.teamId,
                    progressLog,
                    branch: pushBranch,
                };
                deploy(deployParams).catch(err => errorReport(err))
            });
        }

        await progressLog.close();
        return Promise.resolve(Success as ExecuteGoalResult);
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
    }
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
