import { ArtifactDeploySpec, ExecuteWithLog, runWithLog, RunWithLogContext } from "./executeDeploy";
import { logger } from "@atomist/automation-client";
import { TargetInfo } from "../../../spi/deploy/Deployment";
import * as stringify from "json-stringify-safe";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { GoalExecutor } from "../goals/goalExecution";
import { DeployableArtifact } from "../../../spi/artifact/ArtifactStore";

export function undeployArtifactWithLogs<T extends TargetInfo>(spec: ArtifactDeploySpec<T>): GoalExecutor {
    return runWithLog(executeUndeployArtifact(spec), spec.deployer.logInterpreter);
}

export function executeUndeployArtifact<T extends TargetInfo>(spec: ArtifactDeploySpec<T>): ExecuteWithLog {
    return async (rwlc: RunWithLogContext) => {
        const commit = rwlc.status.commit;
        const image = rwlc.status.commit.image;
        const pushBranch = commit.pushes[0].branch;
        rwlc.progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);

        if (!spec.deployer.findDeployments || !spec.deployer.undeploy) {
            throw new Error("Deployer does not implement findDeployments and undeploy");
        }
        const progressLog = rwlc.progressLog;

        // some undeploy processes do not really need the artifact, so don't fail
        let artifactCheckout: DeployableArtifact;
        if (image) {
            const targetUrl = image.imageName;
            artifactCheckout = await spec.artifactStore.checkout(targetUrl, rwlc.id,
                rwlc.credentials).then(rejectUndefined).catch(writeError(progressLog));
        }

        const targetInfo = spec.targeter(rwlc.id, pushBranch);
        const deployments = await spec.deployer.findDeployments(artifactCheckout, targetInfo, rwlc.credentials);

        logger.info("Detected deployments: %s", deployments.map(d => stringify(d)).join(", "));

        await deployments.forEach(async d =>
            await spec.deployer.undeploy(
                targetInfo,
                d,
                progressLog,
            ));

        return {code: 0};
    };
}

function writeError(progressLog: ProgressLog) {
    return (err: Error) => {
        progressLog.write("Error checking out artifact: " + err.message);
        throw err;
    }
}

function rejectUndefined<T>(thing: T): T {
    if (!thing) {
        throw new Error("No DeployableArtifact found");
    }
    return thing;
}