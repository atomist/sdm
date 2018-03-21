import { ArtifactDeploySpec, ExecuteWithLog, RunWithLogContext } from "./executeDeploy";
import { logger, success } from "@atomist/automation-client";
import { deploy, DeployArtifactParams, reactToSuccessfulDeploy } from "./deploy";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { TargetInfo } from "../../../spi/deploy/Deployment";

export function executeUndeployArtifact<T extends TargetInfo>(spec: ArtifactDeploySpec<T>): ExecuteWithLog {
    return async (rwlc: RunWithLogContext) => {
        const commit = rwlc.status.commit;
        const image = rwlc.status.commit.image;
        const pushBranch = commit.pushes[0].branch;
        rwlc.progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);
        const params: DeployArtifactParams<T> = {
            ...spec,
            credentials: rwlc.credentials,
            addressChannels: rwlc.addressChannels,
            id: rwlc.id as GitHubRepoRef,
            targetUrl: image.imageName,
            team: rwlc.context.teamId,
            progressLog: rwlc.progressLog,
            branch: pushBranch,
        };

        if (!image && !spec.artifactStore.imageUrlIsOptional) {
            rwlc.progressLog.write(`No image found on commit ${commit.sha}; can't deploy`);
            throw new Error("No image linked");
        }
        const progressLog = params.progressLog;

        const artifactCheckout = await params.artifactStore.checkout(params.targetUrl, params.id,
            params.credentials)
            .catch(err => {
                progressLog.write("Error checking out artifact: " + err.message);
                throw err;
            });
        if (!artifactCheckout) {
            throw new Error("No DeployableArtifact passed in");
        }

        const targetInfo = params.targeter(params.id, params.branch)
        const deployments = await params.deployer.findDeployments(artifactCheckout, targetInfo, rwlc.credentials);

        await deployments.forEach(async d => await params.deployer.undeploy(
            targetInfo,
            d,
            progressLog,
        ));

        await Promise.all(deployments.map( deployment => reactToSuccessfulDeploy(params, deployment)));
        return { code: 0 };
    };
}