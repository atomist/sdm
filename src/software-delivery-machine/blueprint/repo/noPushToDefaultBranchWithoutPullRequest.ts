/*
 * Copyright © 2018 Atomist, Inc.
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

import { logger } from "@atomist/automation-client";
import { CodeActionRegistration } from "../../../common/delivery/code/CodeActionRegistration";
import { PullRequestForSha } from "../../../typings/types";

import * as _ from "lodash";

/**
 * DM a user who made a push to the default branch that doesn't have an associated pull request
 * @param {PushListenerInvocation} pli
 * @return {Promise<any>}
 * @constructor
 */
export const NoPushToDefaultBranchWithoutPullRequest: CodeActionRegistration = {
    name: "NoPushToDefaultBranchWithoutPullRequest",
    action: async pli => {
        if (pli.push.branch !== pli.push.repo.defaultBranch) {
            // It's not on the default branch, so it's fine
            return;
        }
        const vars: PullRequestForSha.Variables = {owner: pli.id.owner, repo: pli.id.repo, sha: pli.push.commits[0].sha};
        logger.info("About to query for pull requests with variables %j", vars);
        const foundPr = await pli.context.graphClient.query<PullRequestForSha.Query, PullRequestForSha.Variables>({
            name: "PullRequestForSha",
            variables: vars,
        });
        if (foundPr.PullRequest.length === 0) {
            const chatTo = _.get<string>(pli, "push.after.committer.person.chatId.screenName");
            return !!chatTo ?
                pli.context.messageClient.addressUsers(`You committed without a pull request: _${pli.push.after.message}_: This isn't recommended`,
                    chatTo) :
                pli.addressChannels("Committing without a pull request is not recommended");
        }
    },
};
