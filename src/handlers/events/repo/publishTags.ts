import { HandlerContext } from "@atomist/automation-client";
import { ActionResult } from "@atomist/automation-client/action/ActionResult";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Tagger, Tags } from "@atomist/automation-client/operations/tagger/Tagger";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import { GitHubTagRouter } from "@atomist/spring-automation/commands/tag/gitHubTagRouter";
import { AddressChannels } from "../../../handlers/commands/editors/toclient/addressChannels";

export async function publishTags(tagger: Tagger,
                                  id: GitHubRepoRef,
                                  credentials: ProjectOperationCredentials,
                                  addressChannels: AddressChannels,
                                  ctx: HandlerContext): Promise<ActionResult<Tags>> {
    const p = await GitCommandGitProject.cloned(credentials, id);

    const tags: Tags = await tagger(p, ctx, undefined);

    await addressChannels(`Tagging \`${id.owner}/${id.repo}\` with [${tags.tags.join()}]`);
    const edp: EditorOrReviewerParameters = {
        targets: {
            owner: id.owner,
            repo: id.repo,
            sha: "master",
            usesRegex: false,
            credentials,
            repoRef: id,
            test: () => true,
        },
    };
    return doWithRetry(() => GitHubTagRouter(tags, edp, undefined),
        "Publish tags", {
            randomize: true,
            retries: 30,
        });
}
