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
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as stringify from "json-stringify-safe";
import { OnSuccessStatus, StatusState } from "../../../typings/types";
import { createGist, createStatus } from "../../commands/editors/toclient/ghub";
import { ArtifactStore } from "./ArtifactStore";
import { parseCloudFoundryLog } from "./deploy/pcf/cloudFoundryLogParser";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";
import {ArtifactContext, GitHubStatusContext, Phases, StagingEndpointContext} from "./Phases";
import {HttpServicePhases} from "./phases/httpServicePhases";
import { ConsoleProgressLog, MultiProgressLog, SavingProgressLog } from "./ProgressLog";

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
            console.log(`********* Deploy got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.ourContext, status)) {
            console.log(`Deploy wanted to run but it wasn't pending`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return deploy(params.ourContext, params.endpointContext,
            id, params.githubToken, status.targetUrl,
            params.artifactStore, params.deployer, params.targeter);
    }
}

function currentPhaseIsStillPending(currentPhase: GitHubStatusContext, status: OnSuccessStatus.Status): boolean {
    return status.commit.statuses.some(s => s.state === "pending" && s.context === currentPhase);
}

function previousPhaseHitSuccess(expectedPhases: Phases, currentPhase: GitHubStatusContext, status: OnSuccessStatus.Status): boolean {
    if (status.state !== "success") {
        return false;
    }

    const whereAmI = expectedPhases.phases.indexOf(currentPhase);
    if (whereAmI < 0) {
        logger.warn(`Inconsistency! Phase ${currentPhase} is not part of Phases ${stringify(expectedPhases)}`);
        return false;
    }
    if (whereAmI === 0) {
        return false;
    }
    const previousPhase = expectedPhases.phases[whereAmI - 1];
    if (previousPhase === status.context) {
        return true;
    } else {
        logger.info(`${previousPhase} is right before ${currentPhase}; ignoring success of ${status.context}`);
        return false;
    }
}

export function deploy<T extends TargetInfo>(context: string,
                                             endpointContext: string,
                                             id: GitHubRepoRef,
                                             githubToken: string,
                                             targetUrl: string,
                                             artifactStore: ArtifactStore,
                                             deployer: Deployer<T>,
                                             targeter: (id: RemoteRepoRef) => T) {
    const persistentLog = new SavingProgressLog();
    const progressLog = new MultiProgressLog(ConsoleProgressLog, persistentLog);

    return artifactStore.checkout(targetUrl)
        .then(ac => {
            return deployer.deploy(ac, targeter(id), progressLog)
                .then(deployment => {
                    deployment.childProcess.stdout.on("data", what => progressLog.write(what.toString()));
                    deployment.childProcess.addListener("exit", (code, signal) => {
                        const di = parseCloudFoundryLog(persistentLog.log);
                        return createGist(githubToken, {
                            description: `Deployment log for ${id.owner}/${id.repo}`,
                            public: false,
                            files: [{
                                path: `${id.owner}_${id.repo}-${id.sha}.log`,
                                content: persistentLog.log,
                            }],
                        })
                            .then(gist => setDeployStatus(githubToken, id,
                                code === 0 ? "success" : "failure",
                                context, gist))
                            .then(() => {
                                return !!di ?
                                    setEndpointStatus(githubToken, id, endpointContext, di.endpoint) :
                                    true;
                            });

                    });
                    deployment.childProcess.addListener("error", (code, signal) => {
                        return createGist(githubToken, {
                            description: `Failed deployment log for ${id.owner}/${id.repo}`,
                            public: false,
                            files: [{
                                path: `${id.owner}_${id.repo}-${id.sha}.log`,
                                content: persistentLog.log,
                            }],
                        })
                            .then(gist => setDeployStatus(githubToken, id, "failure", context, gist));
                    });
                    return Success;
                }).catch(err => {
                    console.log("ERROR: " + err);
                    return setDeployStatus(githubToken, id, "failure", context, "http://www.test.com")
                        .then(() => ({code: 1, message: err}));
                });
        });
}

function setDeployStatus(token: string, id: GitHubRepoRef, state: StatusState, context: string, target_url: string): Promise<any> {
    return createStatus(token, id, {
        state,
        target_url,
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
