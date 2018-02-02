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

import { GraphQL } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { OnBuiltStatus } from "../../../typings/types";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import { Builder } from "./Builder";
import { ProgressLog } from "./DeploymentChain";
import { MavenBuilder } from "./MavenBuilder";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { ScanBase } from "./ScanOnPush";
import { ChildProcess } from "child_process";

@EventHandler("On successful build",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuiltStatus.graphql"))
export class DeployOnBuildSuccessStatus implements HandleEvent<OnBuiltStatus.Subscription> {

    public handle(event: EventFired<OnBuiltStatus.Subscription>, ctx: HandlerContext): Promise<any> {

        // TODO this is horrid
        const commit = event.data.Status[0].commit;

        const msg = `Saw a success status: ${JSON.stringify(event)}`;
        console.log(msg);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        // TODO get this from handler properly
        const creds = {token: process.env.GITHUB_TOKEN};

        const addr = addressChannelsFor(commit.repo, ctx);

        return addr(`Deploy ${id.owner}/${id.repo}:${id.sha}`);
    }
}

/*
function doBuild(p: GitProject, log: ProgressLog): Promise<any> {
    const builder: Builder = new MavenBuilder();
    const buildInProgress = builder.build(p);
    // deployment.childProcess.addListener("exit", closeListener);

    // TODO why doesn't this work with emitter
    (buildInProgress as ChildProcess).stdout.on("data", what => log.write(what.toString()));

    //buildInProgress.on("data", what => log.write(what.toString()));

    return new Promise((resolve, reject) => {
        // Pipe/use stream
        buildInProgress.on("end", resolve);
        buildInProgress.on("exit", resolve);
        buildInProgress.on("close", resolve);
        buildInProgress.on("error", reject);
    });
}
*/

function markBuilt(id: GitHubRepoRef): Promise<any> {
    // TODO hard coded status must go
    return createStatus(process.env.GITHUB_TOKEN, id, {
        state: "success",
        target_url: `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`,
        context: "build",
    });
}
