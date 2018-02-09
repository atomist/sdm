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
import { OnBuiltStatus } from "../../../typings/types";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import {
    AppInfo,
    CloudFoundryInfo,
    PivotalWebServices,
} from "./Deployment";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { ScanBase } from "./ScanOnPush";
import { CloudFoundryDeployer } from "./CloudFoundryDeployer";
import { slackProgressLog } from "./ProgressLog";

export interface DeployableArtifact extends AppInfo {

    cwd: string;

    filename: string;
}

export type ArtifactCheckout = (targetUrl: string) => Promise<DeployableArtifact>;

export const CloudFoundryTarget: CloudFoundryInfo = {
    ...PivotalWebServices,
    username: "rod@atomist.com",
    password: process.env.PIVOTAL_PASSWORD,
    space: "development",
    org: "springrod",
};

@EventHandler("On successful build: Take the artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuiltStatus.graphql"))
export class DeployOnBuildSuccessStatus implements HandleEvent<OnBuiltStatus.Subscription> {

    constructor(private artifactCheckout: ArtifactCheckout = localCheckout,
                private cfDeployer: CloudFoundryDeployer = new CloudFoundryDeployer()) {
    }

    public handle(event: EventFired<OnBuiltStatus.Subscription>, ctx: HandlerContext): Promise<any> {

        // TODO this is horrid
        const commit = event.data.Status[0].commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const addr = addressChannelsFor(commit.repo, ctx);
        const progressLog = slackProgressLog(commit.repo, ctx);

        const targetUrl = event.data.Status[0].targetUrl;
        return addr(`Deploy ${id.owner}/${id.repo}:${id.sha} from ${targetUrl}`)
            .then(() => {
                return this.artifactCheckout(targetUrl)
                    .then(ac => {
                        console.log("Do PCF deployment of " + JSON.stringify(ac));
                        return this.cfDeployer.deploy(ac, CloudFoundryTarget, progressLog);
                    });
            });
    }

}

/**
 *
 * @param {string} targetUrl
 * @return {string} the directory
 */
const localCheckout: ArtifactCheckout = targetUrl => {
    //Form is http:///var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-20964EBUrRVIZ077a/target/losgatos1-0.1.0-SNAPSHOT.jar
    const lastSlash = targetUrl.lastIndexOf("/");
    const filename = targetUrl.substr(lastSlash + 1);
    const name = filename.substr(0, filename.indexOf("-"));
    const version = filename.substr(name.length + 1);
    const cwd = targetUrl.substring(7, lastSlash);
    const local: DeployableArtifact = {
        name,
        version,
        cwd,
        filename,
    };
    return Promise.resolve(local);
};

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
