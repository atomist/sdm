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
import { OnSuccessStatus } from "../../../typings/types";
import { Builder, RunningBuild } from "./Builder";
import { slackProgressLog } from "./ProgressLog";
import { ArtifactContext, ScanContext } from "./Statuses";

/**
 * See a GitHub success status with context "scan" and trigger a build producing an artifact status
 */
@EventHandler("Build on source scan success",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnSuccessStatus.graphql",
        __dirname, {
        context: ScanContext,
    }))
export class BuildOnScanSuccessStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private builder: Builder) {}

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;
        const team = commit.repo.org.chatTeam.id;

        const msg = `Saw a success status: ${JSON.stringify(event)}`;
        console.log(msg);

        // TODO this should go but subscription parameters may not be working
        if (status.context !== ScanContext) {
            console.log(`********* Build got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        // TODO pull this out as a generic thing
        if (!status.commit.statuses.filter(s => s.state === "pending").some(s => s.context === ArtifactContext)) {
            console.log(`********* Build got called when an artifact isn't pending!`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const creds = {token: params.githubToken};

        // const addr = addressChannelsFor(commit.repo, ctx);

        return params.builder.build(creds, id, team, slackProgressLog(commit.repo, ctx))
            .then(handleBuild)
            .then(() => ({
                code: 0,
            }));
    }
}

function handleBuild(runningBuild: RunningBuild): Promise<any> {
    // deployment.childProcess.addListener("exit", closeListener);
    //b.stdout.on("data", what => log.write(what.toString()));
    // TODO why doesn't this work with emitter
    //(runningBuild.stream as ChildProcess).stdout.on("data", what => log.write(what.toString()));

    return new Promise((resolve, reject) => {
        // Pipe/use stream
        runningBuild.stream.addListener("end", resolve);
        runningBuild.stream.addListener("exit", resolve);
        runningBuild.stream.addListener("close", resolve);
        runningBuild.stream.addListener("error", err => {
            console.log("Saw error " + err);
            return reject(err);
        });
    });
}
