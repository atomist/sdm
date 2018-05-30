/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { raiseIssue } from "@atomist/automation-client/util/gitHub";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import { OnBuildCompleteForDryRun } from "../../../typings/types";
import { createStatus } from "../../../util/github/ghub";
import { DryRunContext } from "../dryRunEditorCommand";

/**
 * React to to result of a dry run build to raise a PR or issue
 */
@EventHandler("React to result of a dry run build", subscription("OnBuildCompleteForDryRun"))
export class OnDryRunBuildComplete implements HandleEvent<OnBuildCompleteForDryRun.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    constructor(private readonly repoRefResolver: RepoRefResolver) {
    }

    public async handle(event: EventFired<OnBuildCompleteForDryRun.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit = build.commit;

        // TODO currently Github only
        const id = params.repoRefResolver.toRemoteRepoRef(commit.repo, {sha: commit.sha}) as GitHubRepoRef;
        const branch = build.commit.pushes[0].branch;

        logger.debug("Assessing dry run for %j: Statuses=%j", id, commit.statuses);
        const dryRunStatus = commit.statuses.find(s => s.context === DryRunContext);
        if (!dryRunStatus || dryRunStatus.state !== "pending") { // this could be any kind of pending, dunno
            logger.debug("Not a dry run build on %j: Statuses=%j", id, commit.statuses);
            return Success;
        }

        switch (build.status) {
            case "passed":
                logger.info("Raising PR for successful dry run on %j", id);
                await id.raisePullRequest({token: params.githubToken},
                    dryRunStatus.description,
                    dryRunStatus.description,
                    branch,
                    "master");
                await createStatus(params.githubToken, id, {
                    context: DryRunContext,
                    target_url: dryRunStatus.targetUrl,
                    description: dryRunStatus.description,
                    state: "success",
                });
                break;

            case "failed" :
            case "broken":
                logger.info("Raising issue for failed dry run on %j on branch %s,", id, branch);
                let body = "Details:\n\n";
                body += !!build.buildUrl ? `[Build log](${build.buildUrl})` : "No build log available";
                body += `\n\n[Branch with failure](${id.url}/tree/${branch} "Failing branch ${branch}")`;
                await raiseIssue(params.githubToken, id, {
                    title: `Failed to ${dryRunStatus.description}`,
                    body,
                });
                await createStatus(params.githubToken, id, {
                    context: DryRunContext,
                    target_url: dryRunStatus.targetUrl,
                    description: dryRunStatus.description,
                    state: "failure",
                });
                break;
        }
        return Success;
    }
}
