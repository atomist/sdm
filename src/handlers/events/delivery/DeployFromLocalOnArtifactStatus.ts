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
import {OnSuccessStatus, StatusState} from "../../../typings/types";
import {createGist, createStatus} from "../../commands/editors/toclient/ghub";
import {ArtifactStore} from "./ArtifactStore";
import {parseCloudFoundryLog} from "./deploy/pcf/cloudFoundryLogParser";
import {Deployer} from "./Deployer";
import {TargetInfo} from "./Deployment";
import {currentPhaseIsStillPending, previousPhaseHitSuccess} from "./Phases";
import {ArtifactContext, HttpServicePhases} from "./phases/httpServicePhases";
import {ConsoleProgressLog, MultiProgressLog, SavingProgressLog} from "./ProgressLog";

/**
 * Deploy a published artifact identified in a GitHub "artifact" status.
 */
@EventHandler("Deploy published artifact",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnSuccessStatus.graphql",
        __dirname, {
            context: ArtifactContext,
        }))
export class DeployFromLocalOnArtifactStatus<T extends TargetInfo> implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private ourContext: string,
                private endpointContext: string,
                private artifactStore: ArtifactStore,
                private deployer: Deployer<T>,
                private targeter: (id: RemoteRepoRef) => T) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        if (!previousPhaseHitSuccess(HttpServicePhases, params.ourContext, status)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.ourContext, status)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return deploy(params.ourContext, params.endpointContext,
            id, params.githubToken, status.targetUrl,
            params.artifactStore, params.deployer, params.targeter);
    }
}

export async function deploy<T extends TargetInfo>(context: string,
                                                   endpointContext: string,
                                                   id: GitHubRepoRef,
                                                   githubToken: string,
                                                   targetUrl: string,
                                                   artifactStore: ArtifactStore,
                                                   deployer: Deployer<T>,
                                                   targeter: (id: RemoteRepoRef) => T) {
    const persistentLog = new SavingProgressLog();
    const progressLog = new MultiProgressLog(ConsoleProgressLog, persistentLog);

    try {
        const ac = await artifactStore.checkout(targetUrl);
        const deployment = await deployer.deploy(ac, targeter(id), progressLog);
        const deploymentFinished = new Promise((resolve, reject) => {

            async function putLogInGistAndFindEndpoint(code, signal) {
                try {
                    const di = parseCloudFoundryLog(persistentLog.log);
                    const gist = await putLogInGist(id, persistentLog);
                    await setDeployStatus(githubToken, id,
                        code === 0 ? "success" : "failure",
                        context, gist);
                    await setEndpointStatus(githubToken, id, endpointContext, di.endpoint)
                        .catch(endpointStatus => {
                            logger.error("Could not set Endpoint status: " + endpointStatus.message);
                            // do not fail this whole handler
                        });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }

            async function putLogInGistAndFailStatus(code) {
                const gist = await putLogInGist(id, persistentLog, true);
                return setDeployStatus(githubToken, id, "failure", context, gist)
                    .then(resolve, reject);
            }

            deployment.childProcess.stdout.on("data", what => progressLog.write(what.toString()));
            deployment.childProcess.addListener("exit", putLogInGistAndFindEndpoint);
            deployment.childProcess.addListener("error", putLogInGistAndFailStatus);
        });
        await deploymentFinished;
        return Success;
    } catch (err) {
        console.log("ERROR: " + err);
        return setDeployStatus(githubToken, id, "failure", context, "http://www.test.com")
            .then(() => ({code: 1, message: err.message}), statusUpdateFailure => {
                logger.warn("Also unable to update the deploy status to failure: " + statusUpdateFailure.message);
                return {code: 1, message: err.message};
            });
    }
}

function putLogInGist(id: GitHubRepoRef, persistentLog, failed: boolean = false) {
    return createGist(undefined, {
        description: `${failed ? " Failed d" : "D"}eployment log for ${id.owner}/${id.repo}`,
        public: false,
        files: [{
            path: `${id.owner}_${id.repo}-${id.sha}.log`,
            content: persistentLog.log,
        }],
    }).catch(gistError => {
        logger.error("Could not create gist: " + gistError.message);
        return "www.atomist.com/sorry-but-gist-creation-failed";
    });
}

function setDeployStatus(token: string, id: GitHubRepoRef, state: StatusState, context: string, targetUrl: string): Promise<any> {
    logger.info(`Setting deploy status for ${context} to ${state} at ${targetUrl}`);
    return createStatus(token, id, {
        state,
        target_url: targetUrl,
        context,
    });
}

function setEndpointStatus(token: string, id: GitHubRepoRef, context: string, endpoint: string): Promise<any> {
    return createStatus(token, id, {
        state: "success",
        target_url: endpoint,
        context,
    });
}
