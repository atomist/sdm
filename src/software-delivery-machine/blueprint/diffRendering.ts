import * as slack from "@atomist/slack-messages/SlackMessages";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {avatarUrl, commitUrl, RepoInfo, truncateCommitMessage, userUrl} from "./lifecycleHelpers";
import {listCommitsBetween} from "../../handlers/commands/editors/toclient/ghub";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";


export function linkToDiff(id: RemoteRepoRef, start: string, end: string, endDescription?: string) {
    return slack.url(diffUrl(id, start, end), `(Compare with ${endDescription || end.substr(0,6)})`);
}

function diffUrl(id: RemoteRepoRef, start: string, end: string) {
    return `${id.url}/compare/${start}...${end}`
}

export async function renderDiff(token: string, id: GitHubRepoRef, start: string, end: string, color: string): Promise<slack.Attachment[]> {
    const fromGitHub = await listCommitsBetween(token, id, start, end);

    const commits: CommitForRendering[] = fromGitHub.commits.map(c => ({
        message: c.commit.message,
        sha: c.sha,
        author: c.author
    }));

    console.log("Rendering " + commits.length + " commits in diff");

    return render({owner: id.owner, name: id.repo}, commits, diffUrl(id, start, end), color);
}

// exported for testing
export interface CommitForRendering {
    sha: string,
    message: string
    author: {
        login: string
    }
}

function render(repo: RepoInfo, commits: CommitForRendering[], fullDiffLink: string, color: string): Promise<slack.Attachment[]> {

    const commitsGroupedByAuthor = [];

    let author = null;
    let commitsByAuthor: any = {};
    let unknownCommitter = false;
    for (const commit of commits) {
        const ca = (commit.author != null && commit.author.login && commit.author.login !== ""
            ? commit.author.login : "(unknown)");

        if (ca === "(unknown)") {
            unknownCommitter = true;
        }

        if (author == null || author !== ca) {
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

    let attachments: slack.Attachment[] = [];

    commitsGroupedByAuthor
        .forEach(cgba => {
            const a = cgba.author;

            const message = cgba.commits.map(c => renderCommitMessage(repo, c)).join("\n");

            const fallback = `lots of commits`;

            const attachment: slack.Attachment = {
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

    //Limit number of commits by author to 5
    if (attachments.length > 5) {
        attachments = attachments.slice(0, 5);
        const fullDiffDescription = "... and more! (${commits.length} total commits)";

        const attachment: slack.Attachment = {
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
    let m = truncateCommitMessage(commitNode.message, repo);
    return "`" + slack.url(commitUrl(repo, commitNode), commitNode.sha.substring(0, 7)) + "` " + m;
}

//
// /**
//  * Safely truncate the first line of a commit message to 50 characters
//  * or less.  Only count printable characters, i.e., not link URLs or
//  * markup.
//  */
// export function truncateCommitMessage(message: string, repo: any): string {
//     const title = message.split("\n")[0];
//     const escapedTitle = slack.escape(title);
//     const linkedTitle = linkIssues(escapedTitle, repo);
//
//     if (linkedTitle.length <= 50) {
//         return linkedTitle;
//     }
//
//     const splitRegExp = /(&(?:[gl]t|amp);|<.*?\||>)/;
//     const titleParts = linkedTitle.split(splitRegExp);
//     let truncatedTitle = "";
//     let addNext = 1;
//     let i;
//     for (i = 0; i < titleParts.length; i++) {
//         let newTitle = truncatedTitle;
//         if (i % 2 === 0) {
//             newTitle += titleParts[i];
//         } else if (/^&(?:[gl]t|amp);$/.test(titleParts[i])) {
//             newTitle += "&";
//         } else if (/^<.*\|$/.test(titleParts[i])) {
//             addNext = 2;
//             continue;
//         } else if (titleParts[i] === ">") {
//             addNext = 1;
//             continue;
//         }
//         if (newTitle.length > 50) {
//             const l = 50 - newTitle.length;
//             titleParts[i] = titleParts[i].slice(0, l) + "...";
//             break;
//         }
//         truncatedTitle = newTitle;
//     }
//     return titleParts.slice(0, i + addNext).join("");
// }
//
// export function linkIssues(body: string, repo: any): string {
//     if (!body || body.length === 0) {
//         return body;
//     }
//
//     const splitter = /(\[.+?\](?:\[.*?\]|\(.+?\)|:\s*http.*)|^```.*\n[\S\s]*?^```\s*\n|<.+?>)/m;
//     const bodyParts = body.split(splitter);
//     const baseUrl = htmlUrl(repo);
//
//     for (let j = 0; j < bodyParts.length; j += 2) {
//         let newPart = bodyParts[j];
//         const allIssueMentions = getIssueMentions(newPart);
//         allIssueMentions.forEach(i => {
//             const iMatchPrefix = (i.indexOf("#") === 0) ? `^|\\W` : repoIssueMatchPrefix;
//             const iRegExp = new RegExp(`(${iMatchPrefix})${i}(?!\\w)`, "g");
//             const iSlug = (i.indexOf("#") === 0) ? `${repo.owner}/${repo.name}${i}` : i;
//             const iUrlPath = iSlug.replace("#", "/issues/");
//             const iLink = slack.url(`${baseUrl}/${iUrlPath}`, i);
//             newPart = newPart.replace(iRegExp, `\$1${iLink}`);
//         });
//         bodyParts[j] = newPart;
//     }
//
//     return bodyParts.join("");
// }
//
// export function getIssueMentions(msg: string = ""): string[] {
//     const allMentions: string[] = [];
//     let matches: string[];
//     // tslint:disable-next-line:no-conditional-assignment
//     while (matches = issueMentionRegExp.exec(msg)) {
//         const owner = matches[1];
//         const repo = matches[2];
//         const issue = matches[3];
//         const slug = (owner && repo) ? `${owner}/${repo}` : "";
//         allMentions.push(`${slug}#${issue}`);
//     }
//
//     return _.uniq(allMentions);
// }
// export function commitUrl(repo: any, commit: any): string {
//     return `${htmlUrl(repo)}/${repoSlug(repo)}/commit/${commit.sha}`;
// }
//
//
// export function htmlUrl(repo: any): string {
//     if (repo.org && repo.org.provider && repo.org.provider.url) {
//         let providerUrl = repo.org.provider.url;
//         if (providerUrl.slice(-1) === "/") {
//             providerUrl = providerUrl.slice(0, -1);
//         }
//         return providerUrl;
//     } else {
//         return "https://github.com";
//     }
// }
//
// export function repoUrl(repo: any): string {
//     return `${htmlUrl(repo)}/${repoSlug(repo)}`;
// }
//
// export function repoSlug(repo: any): string {
//     return `${repo.owner}/${repo.name}`;
//}