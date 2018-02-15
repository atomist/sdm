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

import {GraphQL, HandlerResult, logger, Secret, Secrets, Success} from "@atomist/automation-client";
import {EventFired, EventHandler, HandleEvent, HandlerContext} from "@atomist/automation-client/Handlers";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import {OnImageLinked, StatusState} from "../../../typings/types";
import {createStatus} from "../../commands/editors/toclient/ghub";
import {ArtifactStore} from "./ArtifactStore";
import {parseCloudFoundryLog} from "./deploy/pcf/cloudFoundryLogParser";
import {Deployer} from "./Deployer";
import {TargetInfo} from "./Deployment";
import {createLinkableProgressLog} from "./log/NaiveLinkablePersistentProgressLog";
import {ConsoleProgressLog, MultiProgressLog, SavingProgressLog} from "./log/ProgressLog";
import {currentPhaseIsStillPending, GitHubStatusAndFriends, GitHubStatusContext, Phases, PlannedPhase, previousPhaseSucceeded} from "./Phases";
import {BuiltContext, ContextToPlannedPhase, HttpServicePhases} from "./phases/httpServicePhases";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Deploy linked artifact",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnImageLinked.graphql",
        __dirname))
export class DeployFromLocalOnImageLinked<T extends TargetInfo> implements HandleEvent<OnImageLinked.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private phases: Phases,
                private ourPhase: PlannedPhase,
                private endpointPhase: PlannedPhase,
                private artifactStore: ArtifactStore,
                private deployer: Deployer<T>,
                private targeter: (id: RemoteRepoRef) => T) {
    }

    public handle(event: EventFired<OnImageLinked.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const imageLinked = event.data.ImageLinked[0];
        const commit = imageLinked.commit;

        // TODO doesn't work as built status isn't in, yet
        // const builtStatus = commit.statuses.find(status => status.context === BuiltContext);
        // if (!builtStatus) {
        //     console.log(`Deploy: builtStatus not found`);
        //     return Promise.resolve(Success);
        // }
        const statusAndFriends: GitHubStatusAndFriends = {
            context: BuiltContext,
            state: "success", // builtStatus.state,
            siblings: imageLinked.commit.statuses,
        };

        if (!previousPhaseSucceeded(params.phases, params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return deploy(params.ourPhase, params.endpointPhase,
            id, params.githubToken, imageLinked.image.imageName,
            params.artifactStore, params.deployer, params.targeter);
    }
}

export async function deploy<T extends TargetInfo>(deployPhase: PlannedPhase,
                                                   endpointPhase: PlannedPhase,
                                                   id: GitHubRepoRef,
                                                   githubToken: string,
                                                   targetUrl: string,
                                                   artifactStore: ArtifactStore,
                                                   deployer: Deployer<T>,
                                                   targeter: (id: RemoteRepoRef) => T) {
    try {
        await setDeployStatus(githubToken, id, "pending", deployPhase.context,
            undefined, `Working on ${deployPhase.name}`)
            .catch(err =>
                logger.warn("Failed to update deploy status to tell people we are working on it"));

        const linkableLog = await createLinkableProgressLog();
        const savingLog = new SavingProgressLog();
        const progressLog = new MultiProgressLog(ConsoleProgressLog, savingLog, linkableLog);

        const ac = await artifactStore.checkout(targetUrl);
        const deployment = await deployer.deploy(ac, targeter(id), progressLog);
        const deploymentFinished = new Promise((resolve, reject) => {

            async function lookForEndpointAndPersistLog(code, signal) {
                try {
                    const di = parseCloudFoundryLog(savingLog.log);
                    await progressLog.close();
                    await setDeployStatus(githubToken, id,
                        code === 0 ? "success" : "failure", deployPhase.context, linkableLog.url,
                        `${code === 0 ? "Completed" : "Failed to"} ${deployPhase.name}`);
                    await setEndpointStatus(githubToken, id, endpointPhase.context, di.endpoint,
                        `Completed ${endpointPhase.name}`)
                        .catch(endpointStatus => {
                            logger.error("Could not set Endpoint status: " + endpointStatus.message);
                            // do not fail this whole handler
                        });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }

            async function setFailStatusAndPersistLog() {
                await progressLog.close();
                return setDeployStatus(githubToken, id, "failure", deployPhase.context, linkableLog.url,
                    `Failed to ${deployPhase.name}`)
                    .then(resolve, reject);
            }

            deployment.childProcess.stdout.on("data", what => progressLog.write(what.toString()));
            deployment.childProcess.addListener("exit", lookForEndpointAndPersistLog);
            deployment.childProcess.addListener("error", setFailStatusAndPersistLog);
        });
        await deploymentFinished;
        return Success;
    } catch (err) {
        console.log("ERROR: " + err);
        return setDeployStatus(githubToken, id, "failure", deployPhase.context,
            "http://www.test.com", `Failed to ${deployPhase.name}`)
            .then(() => ({code: 1, message: err.message}), statusUpdateFailure => {
                logger.warn("Also unable to update the deploy status to failure: " + statusUpdateFailure.message);
                return {code: 1, message: err.message};
            });
    }
}

function setDeployStatus(token: string, id: GitHubRepoRef,
                         state: StatusState,
                         context: GitHubStatusContext,
                         targetUrl: string,
                         description?: string): Promise<any> {
    logger.info(`Setting deploy status for ${context} to ${state} at ${targetUrl}`);
    return createStatus(token, id, {
        state,
        target_url: targetUrl,
        context,
        description
    });
}

function setEndpointStatus(token: string, id: GitHubRepoRef,
                           context: GitHubStatusContext,
                           endpoint: string,
                           description?: string): Promise<any> {
    return createStatus(token, id, {
        state: "success",
        target_url: endpoint,
        context,
        description,
    });
}
