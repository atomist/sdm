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

import { GraphQL, HandlerResult, Secret, Secrets } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { OnScanSuccessStatus } from "../../../typings/types";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { Builder, RunningBuild } from "./Builder";
import { MavenBuilder } from "./MavenBuilder";
import { slackProgressLog } from "./ProgressLog";

/**
 * See a GitHub success status with context "scan" and trigger a build
 */
@EventHandler("On source scan success",
    GraphQL.subscriptionFromFile("graphql/subscription/OnScanSuccessStatus.graphql"))
export class BuildOnScanSuccessStatus implements HandleEvent<OnScanSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public handle(event: EventFired<OnScanSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        // TODO this is horrid
        const commit = event.data.Status[0].commit;
        const team = commit.repo.org.chatTeam.id;

        const msg = `Saw a success status: ${JSON.stringify(event)}`;
        console.log(msg);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        const addr = addressChannelsFor(commit.repo, ctx);

        const builder: Builder = new MavenBuilder();

        // TODO check what status
        return builder.build(creds, id, team, slackProgressLog(commit.repo, ctx))
            .then(handleBuild)
            .then(() => ({
                code: 0,
            }));
            //.then(() => markBuilt(id));
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

export const BuildBase = "https://build.atomist.com";

// TODO why does this seem to leave an error
function markBuilt(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
    // TODO hard coded status must go
    return createStatus((creds as TokenCredentials).token, id, {
        state: "success",
        target_url: `${BuildBase}/${id.owner}/${id.repo}/${id.sha}`,
        context: "build",
    });
}
