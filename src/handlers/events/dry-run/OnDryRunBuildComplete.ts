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

import { GraphQL, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { raiseIssue } from "@atomist/automation-client/util/gitHub";
import { OnBuildCompleteForDryRun } from "../../../typings/types";
import { createStatus } from "../../../util/github/ghub";
import { DryRunContext } from "../../commands/editors/dry-run/dryRunEditor";

/**
 * React to to result of a dry run build
 */
@EventHandler("React to result of a dry run build",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuildCompleteForDryRun.graphql"))
export class OnDryRunBuildComplete implements HandleEvent<OnBuildCompleteForDryRun.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public async handle(event: EventFired<OnBuildCompleteForDryRun.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit = build.commit;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const branch = build.commit.pushes[0].branch;

        logger.info("Assessing dry run for %j: Statuses=%j", id, commit.statuses);
        const dryRunStatus = commit.statuses.find(s => s.context === DryRunContext);
        if (!dryRunStatus || dryRunStatus.state !== "pending") {
            logger.info("Not a dry run build on %j: Statuses=%j", id, commit.statuses);
            return Success;
        }

        if (build.status === "passed") {
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
        } else if (build.status === "failed" || build.status === "broken") {
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
        }
        return Success;
    }
}
