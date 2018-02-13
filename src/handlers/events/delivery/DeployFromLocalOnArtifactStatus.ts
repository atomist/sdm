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

import { GraphQL, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { OnSuccessStatus, StatusState } from "../../../typings/types";
import { createGist, createStatus } from "../../commands/editors/toclient/ghub";
import { ArtifactStore } from "./ArtifactStore";
import { parseCloudFoundryLog } from "./deploy/pcf/cloudFoundryLogParser";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";
import { SavingProgressLog } from "./ProgressLog";
import { ArtifactContext, StagingDeploymentContext, StagingEndpointContext } from "./Phases";

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
                private artifactStore: ArtifactStore,
                private deployer: Deployer<T>,
                private targeter: (id: RemoteRepoRef) => T) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        // TODO remove when we figure out subscription
        if (status.context !== ArtifactContext) {
            console.log(`********* Deploy got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        // TODO pull this out as a generic thing
        if (!status.commit.statuses.filter(s => s.state === "pending")
                .some(s => s.context === params.ourContext)) {
            console.log(`********* Deploy got called when [${params.ourContext}] isn't pending!`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return deploy(params.ourContext, id, params.githubToken, status.targetUrl, params.artifactStore, params.deployer, params.targeter);
    }

}

export function deploy<T extends TargetInfo>(context: string,
                                             id: GitHubRepoRef,
                                             githubToken: string,
                                             targetUrl: string,
                                             artifactStore: ArtifactStore,
                                             deployer: Deployer<T>,
                                             targeter: (id: RemoteRepoRef) => T) {
    const persistentLog = new SavingProgressLog();
    const progressLog = persistentLog;

    return setDeployStatus(githubToken, id, "pending", context, "http://test.com")
        .then(() => {
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
                                            setEndpointStatus(githubToken, id, di.endpoint) :
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
                                .then(() =>({ code: 1, message: err}));
                        });
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

function setEndpointStatus(token: string, id: GitHubRepoRef, endpoint: string): Promise<any> {
    return createStatus(token, id, {
        state: "success",
        target_url: endpoint,
        context: StagingEndpointContext,
    });
}
