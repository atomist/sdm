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
import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { SlackMessage } from "@atomist/slack-messages";
import { OnPush } from "../../../typings/types";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import Channels = OnPush.Channels;

@EventHandler("Scan code on PR",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPush.graphql"))
export class ScanOnPush implements HandleEvent<OnPush.Subscription> {

    public handle(event: EventFired<OnPush.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const push: OnPush.Push = event.data.Push[0];
        const commit = push.commits[0];
        // TODO check this

        const msg = `Saw a push: ${commit.sha} - ${commit.message}`;
        console.log(msg);

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);

        // TODO get this from handler properly
        const creds = {token: process.env.GITHUB_TOKEN};

        const addr = addressChannelsFor(push.repo, ctx);

        return GitCommandGitProject.cloned(creds, id)
            .then(p => {
                console.log(`Project is ${p.id}`);
                return withProject(p, addr, ctx)
                    .then(() => {
                        if (push.repo && push.repo.channels) {
                            const channels = push.repo.channels.map(c => c.name);
                            return ctx.messageClient.addressChannels(msg, channels)
                                .then(() => Success, failure);
                        } else {
                            return Success;
                        }
                    });
            });
    }
}

// TODO pull out and make generic
export type AddressChannels = (msg: string | SlackMessage) => Promise<any>;

export interface HasChannels {
    channels?: Array<{name?: string, id?: string}>;
}

export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    const channels = hasChannels.channels.map(c => c.name);
    return msg => ctx.messageClient.addressChannels(msg, channels);
}

// TODO have steps and break out if any of them fails
function withProject(p: GitProject, addressChannels: AddressChannels, ctx: HandlerContext): Promise<any> {
    return p.findFile("pom.xml")
        .then(f => {
            return addressChannels("This project has a pom");
        }).catch(err => {
            return addressChannels("This project has no pom");
        })
        .then(() => markScanned(p.id as GitHubRepoRef));
}

function markScanned(id: GitHubRepoRef): Promise<any> {
    // TODO hard coded status must go
    return createStatus(process.env.GITHUB_TOKEN, id,{
        state: "success",
        target_url: `https://scan.atomist/com/${id.owner}/${id.repo}/${id.sha}`,
    });
}
