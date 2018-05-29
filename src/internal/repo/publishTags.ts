/*
 * Copyright © 2018 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { EditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Tagger, Tags } from "@atomist/automation-client/operations/tagger/Tagger";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import { AddressChannels } from "../../api/context/addressChannels";
import { listTopics } from "../../util/github/ghub";
import { GitHubTagRouter } from "../../util/github/gitHubTagRouter";

/**
 * Run a tagger and publish tags for this repo
 * @param {Tagger} tagger
 * @param {GitHubRepoRef} id
 * @param {ProjectOperationCredentials} credentials
 * @param {AddressChannels} addressChannels
 * @param {HandlerContext} ctx
 */
export async function publishTags(tagger: Tagger,
                                  id: GitHubRepoRef,
                                  credentials: ProjectOperationCredentials,
                                  addressChannels: AddressChannels,
                                  ctx: HandlerContext): Promise<any> {
    const p = await GitCommandGitProject.cloned(credentials, id);
    const tags: Tags = await tagger(p, ctx, undefined);
    if (tags.tags.length > 0) {
        // Add existing tags so they're not lost
        tags.tags = tags.tags.concat(await listTopics(credentials, id));

        await addressChannels(`Tagging \`${id.owner}/${id.repo}\` with tags ${format(tags.tags)}`);
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
}

function format(tags: string[]) {
    return tags.map(t => "`" + t + "`").join(", ");
}
