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

import { GraphQL, MappedParameter, MappedParameters } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import { Builder, RunningBuild } from "./Builder";
import { slackProgressLog } from "./DeploymentChain";
import { MavenBuilder } from "./MavenBuilder";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { ScanBase } from "./ScanOnPush";
import { OnScanSuccessStatus } from "../../../typings/types";

/**
 * See a GitHub success status with context "scan" and trigger a build
 */
@EventHandler("On source scan success",
    GraphQL.subscriptionFromFile("graphql/subscription/OnScanSuccessStatus.graphql"))
export class BuildOnScanSuccessStatus implements HandleEvent<OnScanSuccessStatus.Subscription> {

    // TODO fix this
   // @MappedParameter(MappedParameters.SlackTeam, false)
    public team: string = "T5964N9B7";

    public handle(event: EventFired<OnScanSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<any> {

        // TODO this is horrid
        const commit = event.data.Status[0].commit;

        const msg = `Saw a success status: ${JSON.stringify(event)}`;
        console.log(msg);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        // TODO get this from handler properly
        const creds = {token: process.env.GITHUB_TOKEN};

        const addr = addressChannelsFor(commit.repo, ctx);

        const builder: Builder = new MavenBuilder();

        // TODO check what status
        return addr("Building. Please wait...")
            .then(() => builder.build(creds, id, params.team, slackProgressLog(commit.repo, ctx)))
            .then(handleBuild)
            .then(() => markBuilt(id))
            .then(() => addr(`Finished building ${id.owner}/${id.repo}:${id.sha}`));
    }
}

function handleBuild(runningBuild: RunningBuild): Promise<any> {
    // deployment.childProcess.addListener("exit", closeListener);
    //b.stdout.on("data", what => log.write(what.toString()));
    // TODO why doesn't this work with emitter
    //(runningBuild.stream as ChildProcess).stdout.on("data", what => log.write(what.toString()));

    //buildInProgress.on("data", what => log.write(what.toString()));

    return new Promise((resolve, reject) => {
        // Pipe/use stream
        runningBuild.stream.addListener("end", resolve);
        runningBuild.stream.addListener("exit", resolve);
        runningBuild.stream.addListener("close", resolve);
        runningBuild.stream.addListener("error", reject);
    });
}

function markBuilt(id: GitHubRepoRef): Promise<any> {
    // TODO hard coded status must go
    return createStatus(process.env.GITHUB_TOKEN, id, {
        state: "success",
        target_url: `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`,
        context: "build",
    });
}
