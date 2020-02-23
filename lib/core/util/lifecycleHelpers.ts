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

import * as slack from "@atomist/slack-messages";
import * as _ from "lodash";

// This file copied from atomist/lifecycle-automation

/**
 * Safely truncate the first line of a commit message to 50 characters
 * or less.  Only count printable characters, i.e., not link URLs or
 * markup.
 */
export function truncateCommitMessage(message: string, repo: any): string {
    const title = message.split("\n")[0];
    const escapedTitle = slack.escape(title);
    const linkedTitle = linkIssues(escapedTitle, repo);

    if (linkedTitle.length <= 50) {
        return linkedTitle;
    }

    const splitRegExp = /(&(?:[gl]t|amp);|<.*?\||>)/;
    const titleParts = linkedTitle.split(splitRegExp);
    let truncatedTitle = "";
    let addNext = 1;
    let i;
    for (i = 0; i < titleParts.length; i++) {
        let newTitle = truncatedTitle;
        if (i % 2 === 0) {
            newTitle += titleParts[i];
        } else if (/^&(?:[gl]t|amp);$/.test(titleParts[i])) {
            newTitle += "&";
        } else if (/^<.*\|$/.test(titleParts[i])) {
            addNext = 2;
            continue;
        } else if (titleParts[i] === ">") {
            addNext = 1;
            continue;
        }
        if (newTitle.length > 50) {
            const l = 50 - newTitle.length;
            titleParts[i] = titleParts[i].slice(0, l) + "...";
            break;
        }
        truncatedTitle = newTitle;
    }
    return titleParts.slice(0, i + addNext).join("");
}

/**
 * Generate GitHub repository "slug", i.e., owner/repo.
 *
 * @param repo repository with .owner and .name
 * @return owner/name string
 */
export function repoSlug(repo: RepoInfo): string {
    return `${repo.owner}/${repo.name}`;
}

export function htmlUrl(repo: RepoInfo): string {
    if (repo.org && repo.org.provider && repo.org.provider.url) {
        let providerUrl = repo.org.provider.url;
        if (providerUrl.slice(-1) === "/") {
            providerUrl = providerUrl.slice(0, -1);
        }
        return providerUrl;
    } else {
        return "https://github.com";
    }
}

export const DefaultGitHubApiUrl = "https://api.github.com/";

export function apiUrl(repo: any): string {
    if (repo.org && repo.org.provider && repo.org.provider.url) {
        let providerUrl = repo.org.provider.apiUrl;
        if (providerUrl.slice(-1) === "/") {
            providerUrl = providerUrl.slice(0, -1);
        }
        return providerUrl;
    } else {
        return DefaultGitHubApiUrl;
    }
}

export function userUrl(repo: any, login: string): string {
    return `${htmlUrl(repo)}/${login}`;
}

export interface RepoInfo {
    owner: string;
    name: string;
    org?: {
        provider: { url?: string },
    };
}

export function avatarUrl(repo: any, login: string): string {
    if (repo.org !== undefined && repo.org.provider !== undefined && repo.org.provider.url !== undefined) {
        return `${htmlUrl(repo)}/avatars/${login}`;
    } else {
        return `https://avatars.githubusercontent.com/${login}`;
    }
}

export function commitUrl(repo: RepoInfo, commit: any): string {
    return `${htmlUrl(repo)}/${repoSlug(repo)}/commit/${commit.sha}`;
}

/**
 * If the URL is of an image, return a Slack message attachment that
 * will render that image.  Otherwise return null.
 *
 * @param url full URL
 * @return Slack message attachment for image or null
 */
function urlToImageAttachment(url: string): slack.Attachment {
    const imageRegExp = /[^\/]+\.(?:png|jpe?g|gif|bmp)$/i;
    const imageMatch = imageRegExp.exec(url);
    if (imageMatch) {
        const image = imageMatch[0];
        return {
            text: image,
            image_url: url,
            fallback: image,
        };
    } else {
        return undefined;
    }
}

/**
 * Find image URLs in a message body, returning an array of Slack
 * message attachments, one for each image.  It expects the message to
 * be in Slack message markup.
 *
 * @param body message body
 * @return array of Slack message Attachments with the `image_url` set
 *         to the URL of the image and the `text` and `fallback` set
 *         to the image name.
 */
export function extractImageUrls(body: string): slack.Attachment[] {
    const slackLinkRegExp = /<(https?:\/\/.*?)(?:\|.*?)?>/g;
    // inspired by https://stackoverflow.com/a/6927878/5464956
    const urlRegExp = /\bhttps?:\/\/[^\s<>\[\]]+[^\s`!()\[\]{};:'".,<>?«»“”‘’]/gi;
    const attachments: slack.Attachment[] = [];
    const bodyParts = body.split(slackLinkRegExp);
    for (let i = 0; i < bodyParts.length; i++) {
        if (i % 2 === 0) {
            let match: RegExpExecArray;
            // tslint:disable-next-line:no-conditional-assignment
            while (match = urlRegExp.exec(bodyParts[i])) {
                const url = match[0];
                const attachment = urlToImageAttachment(url);
                if (attachment) {
                    attachments.push(attachment);
                }
            }
        } else {
            const url = bodyParts[i];
            const attachment = urlToImageAttachment(url);
            if (attachment) {
                attachments.push(attachment);
            }
        }
    }
    const uniqueAttachments: slack.Attachment[] = [];
    attachments.forEach(a => {
        if (!uniqueAttachments.some(ua => ua.image_url === a.image_url)) {
            uniqueAttachments.push(a);
        }
    });
    return uniqueAttachments;
}

/**
 * Find issue mentions in body and replace them with links.
 *
 * @param body message to modify
 * @param repo repository information
 * @return string with issue mentions replaced with links
 */
export function linkIssues(body: string, repo: any): string {
    if (!body || body.length === 0) {
        return body;
    }

    const splitter = /(\[.+?\](?:\[.*?\]|\(.+?\)|:\s*http.*)|^```.*\n[\S\s]*?^```\s*\n|<.+?>)/m;
    const bodyParts = body.split(splitter);
    const baseUrl = htmlUrl(repo);

    for (let j = 0; j < bodyParts.length; j += 2) {
        let newPart = bodyParts[j];
        const allIssueMentions = getIssueMentions(newPart);
        allIssueMentions.forEach(i => {
            const iMatchPrefix = (i.indexOf("#") === 0) ? `^|\\W` : repoIssueMatchPrefix;
            const iRegExp = new RegExp(`(${iMatchPrefix})${i}(?!\\w)`, "g");
            const iSlug = (i.indexOf("#") === 0) ? `${repo.owner}/${repo.name}${i}` : i;
            const iUrlPath = iSlug.replace("#", "/issues/");
            const iLink = slack.url(`${baseUrl}/${iUrlPath}`, i);
            newPart = newPart.replace(iRegExp, `\$1${iLink}`);
        });
        bodyParts[j] = newPart;
    }

    return bodyParts.join("");
}

const gitHubUserMatch = "[a-zA-Z\\d]+(?:-[a-zA-Z\\d]+)*";

/**
 * Regular expression to find issue mentions.  There are capture
 * groups for the issue repository owner, repository name, and issue
 * number.  The capture groups for repository owner and name are
 * optional and therefore may be null, although if one is set, the
 * other should be as well.
 *
 * The rules for preceding characters is different for current repo
 * matches, e.g., "#43", and other repo matches, e.g., "some/repo#44".
 * Current repo matches allow anything but word characters to precede
 * them.  Other repo matches only allow a few other characters to
 * preceed them.
 */
const repoIssueMatchPrefix = "^|[[\\s:({]";
// tslint:disable-next-line:max-line-length
const issueMentionMatch = `(?:^|(?:${repoIssueMatchPrefix})(${gitHubUserMatch})\/(${gitHubUserMatch})|\\W)#([1-9]\\d*)(?!\\w)`;
const issueMentionRegExp = new RegExp(issueMentionMatch, "g");

/**
 * Find all issue mentions and return an array of unique issue
 * mentions as "#3" and "owner/repo#5".
 *
 * @param msg string that may contain mentions
 * @return unique list of issue mentions as #N or O/R#N
 */
export function getIssueMentions(msg: string = ""): string[] {
    const allMentions: string[] = [];
    let matches: string[];
    // tslint:disable-next-line:no-conditional-assignment
    while (matches = issueMentionRegExp.exec(msg)) {
        const owner = matches[1];
        const repo = matches[2];
        const issue = matches[3];
        const slug = (owner && repo) ? `${owner}/${repo}` : "";
        allMentions.push(`${slug}#${issue}`);
    }

    return _.uniq(allMentions);
}
