/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { logger } from "@atomist/automation-client/lib/util/logger";
import {
    Attachment,
    url,
} from "@atomist/slack-messages";
import { listCommitsBetween } from "../github/ghub";
import {
    avatarUrl,
    commitUrl,
    RepoInfo,
    truncateCommitMessage,
    userUrl,
} from "../lifecycleHelpers";

/* tslint:disable:no-unused-variable */

export function linkToDiff(id: RemoteRepoRef, start: string, end: string, endDescription?: string): string {
    return url(diffUrl(id, start, end), `(Compare with ${endDescription || end.substr(0, 6)})`);
}

function diffUrl(id: RemoteRepoRef, start: string, end: string): string {
    return `${id.url}/compare/${start}...${end}`;
}

export async function renderDiff(token: string, id: GitHubRepoRef, start: string, end: string, color: string): Promise<Attachment[]> {
    const fromGitHub = await listCommitsBetween(token, id, start, end);

    const commits: CommitForRendering[] = fromGitHub.commits.map(c => ({
        message: c.commit.message,
        sha: c.sha,
        author: c.author,
    }));

    logger.info("Rendering %d commits in diff", commits.length);
    return render({ owner: id.owner, name: id.repo }, commits, diffUrl(id, start, end), color);
}

// exported for testing
export interface CommitForRendering {
    sha: string;
    message: string;
    author: {
        login: string,
    };
}

function render(repo: RepoInfo, commits: CommitForRendering[], fullDiffLink: string, color: string): Promise<Attachment[]> {

    const commitsGroupedByAuthor = [];

    let author;
    let commitsByAuthor: any = {};
    // let unknownCommitter = false;
    for (const commit of commits) {
        const ca = (commit.author !== undefined && commit.author.login && commit.author.login !== ""
            ? commit.author.login : "(unknown)");

        // if (ca === "(unknown)") {
        //     unknownCommitter = true;
        // }

        if (author === undefined || author !== ca) {
            commitsByAuthor = {
                author: ca,
                commits: [],
            };
            author = ca;
            commitsGroupedByAuthor.push(commitsByAuthor);
        }
        if (ca === author) {
            commitsByAuthor.commits.push(commit);
        }
    }

    let attachments: Attachment[] = [];

    commitsGroupedByAuthor
        .forEach(cgba => {
            const a = cgba.author;

            const message = cgba.commits.map(c => renderCommitMessage(repo, c)).join("\n");

            const fallback = `lots of commits`;

            const attachment: Attachment = {
                author_name: `@${a}`,
                author_link: userUrl(repo, a),
                author_icon: avatarUrl(repo, a),
                text: message,
                mrkdwn_in: ["text"],
                color,
                fallback,
                actions: [],
            };
            attachments.push(attachment);
        });

    // Limit number of commits by author to 3
    if (attachments.length > 3) {
        attachments = attachments.slice(0, 3);
        const fullDiffDescription = `... and more! (${commits.length} total commits)`;

        const attachment: Attachment = {
            title_link: fullDiffLink,
            title: fullDiffDescription,
            color,
            fallback: fullDiffDescription,
            actions: [],
        };
        attachments.push(attachment);
    }

    // if (attachments.length > 0) {
    //     const lastAttachment = attachments[attachments.length - 1];
    //     if (unknownCommitter) {
    //         lastAttachment.footer_icon = "https://images.atomist.com/rug/question.png";
    //         lastAttachment.footer = `Unrecognized author. Please use a known email address to commit.`;
    //     } else {
    //         lastAttachment.footer_icon = "https://images.atomist.com/rug/commit.png";
    //         if (lastAttachment.footer != null) {
    //             lastAttachment.footer = `${url(repoUrl(repo), repoSlug(repo))} - ${lastAttachment.footer}`;
    //         } else {
    //             lastAttachment.footer = url(repoUrl(repo), repoSlug(repo));
    //         }
    //         lastAttachment.ts = Math.floor(Date.parse(push.timestamp) / 1000);
    //     }

    return Promise.resolve(attachments);
}

// exported for testing
export function renderCommitMessage(repo: RepoInfo, commitNode: CommitForRendering): string {
    // Cut commit to 50 chars of first line
    const m = truncateCommitMessage(commitNode.message, repo);
    return "`" + url(commitUrl(repo, commitNode), commitNode.sha.substring(0, 7)) + "` " + m;
}
