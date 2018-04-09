
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { filesChangedSince, filesChangedSinceParentCommit } from "../../../util/git/filesChangedSince";
import { CodeReactionInvocation } from "../../listener/CodeReactionListener";
import { addressChannelsFor, messageDestinationsFor } from "../../slack/addressChannels";
import { teachToRespondInEventHandler } from "../../slack/contextMessageRouting";
import { RunWithLogContext } from "../goals/support/runWithLog";

/**
 * Create a CodeReactionInvocation from the given context
 * @param {RunWithLogContext} rwlc
 * @param {GitProject} project
 * @return {Promise<CodeReactionInvocation>}
 */
export async function createCodeReactionInvocation(rwlc: RunWithLogContext, project: GitProject): Promise<CodeReactionInvocation> {
    const {status, credentials, id, context} = rwlc;
    const commit = status.commit;
    const smartContext = teachToRespondInEventHandler(context, messageDestinationsFor(commit.repo, context));

    const addressChannels = addressChannelsFor(commit.repo, context);
    const push = commit.pushes[0];
    const filesChanged = push.before ?
        await filesChangedSince(project, push.before.sha) :
        await filesChangedSinceParentCommit(project);
    return {
        id,
        context: smartContext,
        addressChannels,
        project,
        credentials,
        filesChanged,
        commit,
        push,
    };
}
