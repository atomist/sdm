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

import {GraphQL, logger, Secret, Secrets, Success, success} from "@atomist/automation-client";
import {EventFired, EventHandler, failure, HandleEvent, HandlerContext, HandlerResult} from "@atomist/automation-client/Handlers";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {ProjectOperationCredentials, TokenCredentials} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {GitCommandGitProject} from "@atomist/automation-client/project/git/GitCommandGitProject";
import {GitProject} from "@atomist/automation-client/project/git/GitProject";
import {OnPendingStatus, StatusState} from "../../../typings/types";
import {addressChannelsFor} from "../../commands/editors/toclient/addressChannels";
import {createStatus} from "../../commands/editors/toclient/ghub";
import {ScanContext} from "./phases/httpServicePhases";

export interface ProjectScanResult {
    passed: boolean;
    message?: string;
}

export type ProjectScanner = (p: GitProject,
                              ctx: HandlerContext) => Promise<ProjectScanResult>;

/**
 * Scan code on a push to master. Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code on PR",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnPendingStatus.graphql",
        __dirname, {
            context: ScanContext,
        }))
export class ScanOnPendingScanStatus implements HandleEvent<OnPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private projectScanner: ProjectScanner) {
    }

    public handle(event: EventFired<OnPendingStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        if (status.context !== ScanContext || status.state !== "pending") {
            logger.warn(`I was looking for ${ScanContext} being pending, but I heard about ${status.context} being ${status.state}`);
            return Promise.resolve(Success);
        }

        const addressChannels = addressChannelsFor(commit.repo, ctx);

        return GitCommandGitProject.cloned(creds, id)
            .then(p => {
                return params.projectScanner(p, ctx)
                    .then(scanResult => {
                        if (scanResult.passed) {
                            return markScanned(p.id as GitHubRepoRef, "success", creds);
                        } else {
                            return addressChannels(`Scan failed: ${scanResult.message}`)
                                .then(() => markScanned(p.id as GitHubRepoRef, "failure", creds));
                        }
                    }).then(() => success());
            });
    }
}

export const ScanBase = "https://scan.atomist.com";

// TODO this should take a URL with detailed information
function markScanned(id: GitHubRepoRef, state: StatusState, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`,
        context: ScanContext,
    });
}
