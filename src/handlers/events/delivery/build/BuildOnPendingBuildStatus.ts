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

import { GraphQL, HandleEvent, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { currentGoalIsStillPending, GitHubStatusAndFriends, Goal } from "../../../../common/goals/Goal";
import { PushTest, PushTestInvocation } from "../../../../common/listener/GoalSetter";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { Builder } from "../../../../spi/build/Builder";
import { OnAnyPendingStatus, OnAnySuccessStatus } from "../../../../typings/types";
import { StatusSuccessHandler } from "../../StatusSuccessHandler";

/**
 * Implemented by classes that can choose a builder based on project content etc.
 */
export interface ConditionalBuilder {

    guard: PushTest;

    builder: Builder;
}

/**
 * See a GitHub success status with context "scan" and trigger a build producing an artifact status
 */
@EventHandler("Build on source scan success",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnyPendingStatus.graphql"))
export class BuildOnPendingBuildStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(public goal: Goal,
                private conditionalBuilders: ConditionalBuilder[]) {
        this.conditionalBuilders = conditionalBuilders;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
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
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        logger.debug(`BuildOnScanSuccessStatus: our context=[%s], %d conditional builders, statusAndFriends=[%j]`,
            params.goal.context, params.conditionalBuilders.length, statusAndFriends);

        if (!currentGoalIsStillPending(params.goal.context, statusAndFriends)) {
            return Success;
        }
        if (!params.goal.preconditionsMet(credentials, id, event.data)) {
            return Success;
        }

        logger.info(`Running build. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        await dedup(commit.sha, async () => {
            const project = await GitCommandGitProject.cloned(credentials, id);

            const i: PushTestInvocation = {
                id,
                project,
                credentials,
                context,
                addressChannels: addressChannelsFor(commit.repo, context),
                // TODO flesh this out properly
                push: {
                    id: null,
                    branch: status.commit.pushes[0].branch,
                    before: {
                        sha: null,
                        message: null,
                        committer: {
                            person: null,
                        },
                    },
                    after: {
                        sha: null,
                        message: null,
                        committer: {
                            person: null,
                        },
                    },
                    repo: commit.repo,
                    commits: [status.commit],
                },
            };

            const builders: boolean[] = await Promise.all(params.conditionalBuilders
                .map(b => b.guard(i)));
            const indx = builders.indexOf(true);
            if (indx < 0) {
                throw new Error(`Don't know how to build project ${id.owner}:${id.repo}`);
            }
            const builder = params.conditionalBuilders[indx].builder;
            logger.info("Building project %s:%s with builder [%s]", id.owner, id.repo, builder.name);

            const allBranchesThisCommitIsOn = commit.pushes.map(p => p.branch);
            const theDefaultBranchIfThisCommitIsOnIt = allBranchesThisCommitIsOn.find(b => b === commit.repo.defaultBranch);
            const someBranchIDoNotReallyCare = allBranchesThisCommitIsOn.find(b => true);
            const branchToMarkTheBuildWith = theDefaultBranchIfThisCommitIsOnIt || someBranchIDoNotReallyCare || "master";

            // the builder is expected to result in a complete Build event (which will update the build status)
            // and an ImageLinked event (which will update the artifact status).
            return builder.initiateBuild(credentials, id, i.addressChannels, team, {branch: branchToMarkTheBuildWith});
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
