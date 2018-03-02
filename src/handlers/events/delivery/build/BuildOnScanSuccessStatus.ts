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
import { EventFired, EventHandler, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ProjectListenerInvocation } from "../../../../common/listener/Listener";
import { currentPhaseIsStillPending, GitHubStatusAndFriends, nothingFailed, Phases, previousPhaseSucceeded } from "../../../../common/phases/Phases";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { Builder } from "../../../../spi/build/Builder";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { StatusSuccessHandler } from "../../StatusSuccessHandler";

export interface ConditionalBuilder {
    builder: Builder;
    test: (i: ProjectListenerInvocation) => Promise<boolean>;
}

/**
 * See a GitHub success status with context "scan" and trigger a build producing an artifact status
 */
@EventHandler("Build on source scan success",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnySuccessStatus.graphql"))
export class BuildOnScanSuccessStatus implements StatusSuccessHandler {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private conditionalBuilders: ConditionalBuilder[];

    constructor(public phases: Phases,
                public ourContext: string,
                ...conditionalBuilders: ConditionalBuilder[]) {
        this.conditionalBuilders = conditionalBuilders;
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const team = commit.repo.org.chatTeam.id;

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            description: status.description,
            siblings: status.commit.statuses,
        };

        logger.debug(`BuildOnScanSuccessStatus: our context=[%s], %d conditional builders, statusAndFriends=[%j]`,
            params.ourContext, params.conditionalBuilders.length, statusAndFriends);

        if (nothingFailed(statusAndFriends) && !previousPhaseSucceeded(params.phases, params.ourContext, statusAndFriends)) {
            return Success;
        }

        if (!currentPhaseIsStillPending(params.ourContext, statusAndFriends)) {
            return Success;
        }

        logger.info(`Running build. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        await dedup(commit.sha, async () =>  {
            const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
            const credentials = {token: params.githubToken};
            const project = await GitCommandGitProject.cloned(credentials, id);

            const i: ProjectListenerInvocation = {
                id,
                project,
                credentials,
                context,
                addressChannels: addressChannelsFor(commit.repo, context),
            };

            const builders: boolean[] = await Promise.all(params.conditionalBuilders.map(b => b.test(i)));
            const indx = builders.indexOf(true);
            if (indx < 0) {
                throw new Error(`Don't know how to build project ${id.owner}${id.repo}`);
            }
            const builder = params.conditionalBuilders[indx].builder;

            const allBranchesThisCommitIsOn = commit.pushes.map(p => p.branch);
            const theDefaultBranchIfThisCommitIsOnIt = allBranchesThisCommitIsOn.find(b => b === commit.repo.defaultBranch);
            const someBranchIDoNotReallyCare = allBranchesThisCommitIsOn.find(b => true);
            const branchToMarkTheBuildWith = theDefaultBranchIfThisCommitIsOnIt || someBranchIDoNotReallyCare || "master";

            // the builder is expected to result in a complete Build event (which will update the build status)
            // and an ImageLinked event (which will update the artifact status).
            return builder.initiateBuild(credentials, id, i.addressChannels, team, { branch: branchToMarkTheBuildWith });
        });
        return Success;
    }
}

const running = {};

async function dedup<T>(key: string, f: () => Promise<T>): Promise<T | void> {
    if (running[key]) {
        logger.warn("This op was called twice for " + key);
        return Promise.resolve();
    }
    running[key] = true;
    const promise = f().then(t => {
        running[key] = undefined;
        return t;
    });
    return promise;
}
