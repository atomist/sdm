import { CodeReactionInvocation } from "../../../common/listener/CodeReactionListener";

/**
 * React to a push by listing changed files to any Slack channels
 * associated with the repo
 * @param {CodeReactionInvocation} i
 * @return {Promise<any>}
 */
export async function listChangedFiles(i: CodeReactionInvocation): Promise<any> {
    return i.addressChannels(`Files changed:\n${i.filesChanged.map(n => "- `" + n + "`").join("\n")}`);
}
