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

import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";

const Subscription = `
subscription FindReferencedGitHubIssue {
  Commit {
    sha
    message
    repo {
      owner
      name
      channels {
        name
      }
    }
  }
}`;

const Pattern = /[cC]rush(ed|ing)[\s]*#([0-9]*)/g;

@EventHandler("Find referenced GitHub issues and PRs in commit message", Subscription)
export class FindReferencedGitHubIssue implements HandleEvent<Commits> {

    public handle(event: EventFired<Commits>, ctx: HandlerContext): Promise<HandlerResult> {
        const commit = event.data.Commit[0];
        const referencedIssues: string[] = [];
        let match;
        while (match = Pattern.exec(commit.message)) {
            referencedIssues.push(`#${match[2]}`);
        }
        if (referencedIssues.length > 0 && commit.repo && commit.repo.channels) {
            const msg = `You crushed ${referencedIssues.join(", ")} with commit` +
                ` \`${commit.repo.owner}/${commit.repo.name}@${commit.sha.slice(0, 7)}\``;
            const channels = commit.repo.channels.map(c => c.name);
            return ctx.messageClient.addressChannels(msg, channels)
                .then(() => Success, failure);
        } else {
            return Promise.resolve(Success);
        }
    }
}

export interface Commits {
    Commit: [{
        sha: string;
        message: string;
        repo: {
            owner: string;
            name: string;
            channels: [{
                name: string;
            }]
        }
    }];
}
